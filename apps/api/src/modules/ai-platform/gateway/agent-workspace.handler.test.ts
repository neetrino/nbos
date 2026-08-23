import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AgentPolicyService } from '../policy/agent-policy.service';
import type { AuthenticatedAgent } from '../auth/agent-authenticator.service';
import { AgentWorkspaceHandler } from './agent-workspace.handler';

function agent(): AuthenticatedAgent {
  return {
    agentId: 'agent-1',
    agentName: 'Cursor Agent',
    agentState: 'ACTIVE',
    credentialId: 'cred-1',
    credentialKeyId: 'aabbccddeeff001122',
    credentialState: 'ACTIVE',
    actor: actorContextFromMachine({
      id: 'agent-1',
      type: 'EXTERNAL_AGENT',
      displayName: 'Cursor Agent',
    }),
  };
}

const WS_A = {
  id: 'ws-a',
  name: 'Alpha',
  type: 'STANDALONE_OPERATIONAL',
  projectId: 'proj-shared',
  productId: null,
  extensionId: null,
  scrumEnabled: false,
};

describe('AgentWorkspaceHandler isolation', () => {
  let prisma: MockPrisma;
  let policy: { assertAllowed: ReturnType<typeof vi.fn>; evaluate: ReturnType<typeof vi.fn> };
  let grants: { listScopes: ReturnType<typeof vi.fn> };
  let handler: AgentWorkspaceHandler;

  beforeEach(() => {
    prisma = createMockPrisma();
    policy = {
      assertAllowed: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }),
      evaluate: vi.fn().mockResolvedValue({ outcome: 'ALLOW' }),
    };
    grants = {
      listScopes: vi.fn().mockResolvedValue([
        {
          scopeType: 'WORKSPACE',
          scopeId: 'ws-a',
          revokedAt: null,
          expiresAt: null,
        },
      ]),
    };
    prisma.workSpace.findUnique.mockResolvedValue(WS_A);
    prisma.workSpace.findMany.mockResolvedValue([WS_A]);
    handler = new AgentWorkspaceHandler(prisma as never, policy as never, grants as never);
  });

  it('lists only the granted Work Space', async () => {
    const result = (await handler.read(agent(), {})) as {
      items: Array<{ id: string }>;
    };
    expect(result.items.map((item) => item.id)).toEqual(['ws-a']);
  });

  it('hides Work Space B behind the same error as a missing id', async () => {
    prisma.workSpace.findUnique.mockResolvedValue(null);
    policy.assertAllowed.mockRejectedValue(AgentAccessException.resourceNotAvailable());

    await expect(handler.read(agent(), { workspaceId: 'ws-b' })).rejects.toMatchObject({
      code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    });
    await expect(handler.read(agent(), { workspaceId: 'does-not-exist' })).rejects.toMatchObject({
      code: 'AGENT_RESOURCE_NOT_AVAILABLE',
    });
  });

  it('does not widen a WORKSPACE grant to other workspaces on the same project', async () => {
    prisma.workSpace.findMany.mockResolvedValue([WS_A, { ...WS_A, id: 'ws-b', name: 'Beta' }]);
    const result = (await handler.read(agent(), {})) as { items: Array<{ id: string }> };
    expect(result.items.map((item) => item.id)).toEqual(['ws-a']);
  });

  it('resolves an Extension delivery id to the Product Work Space before policy', async () => {
    prisma.workSpace.findUnique.mockResolvedValue({
      ...WS_A,
      id: 'ws-ext',
      type: 'EXTENSION_DELIVERY',
      productId: null,
      extensionId: 'ext-1',
    });
    prisma.extension.findUnique.mockResolvedValue({ productId: 'prod-1' });
    prisma.workSpace.findFirst.mockResolvedValue({
      ...WS_A,
      id: 'ws-product',
      type: 'PRODUCT_DELIVERY',
      productId: 'prod-1',
    });

    await handler.read(agent(), { workspaceId: 'ws-ext' });

    expect(policy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ workspaceId: 'ws-product' }),
      }),
    );
  });

  it('returns an empty list when the capability is granted but no workspace matches', async () => {
    grants.listScopes.mockResolvedValue([]);
    policy.evaluate.mockResolvedValue({ outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' });
    const result = (await handler.read(agent(), {})) as {
      items: unknown[];
      meta: { total: number };
    };
    expect(result.items).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(policy.assertAllowed).not.toHaveBeenCalled();
  });

  it('refuses discovery when the agent is disabled', async () => {
    policy.assertAllowed.mockRejectedValue(AgentAccessException.fromDenyReason('AGENT_DISABLED'));
    await expect(handler.read(agent(), {})).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
    expect(policy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ capabilityKey: 'workspaces.read' }),
    );
  });
});

describe('AgentWorkspaceHandler list-deny audit', () => {
  let prisma: MockPrisma;
  let audit: { logMachineAction: ReturnType<typeof vi.fn> };
  let grants: { listScopes: ReturnType<typeof vi.fn> };
  let handler: AgentWorkspaceHandler;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = { logMachineAction: vi.fn().mockResolvedValue(undefined) };
    grants = { listScopes: vi.fn().mockResolvedValue([]) };
    prisma.workSpace.findUnique.mockResolvedValue(WS_A);
    const policy = new AgentPolicyService(prisma as never, audit as never);
    handler = new AgentWorkspaceHandler(prisma as never, policy, grants as never);
  });

  it('audits an ungranted workspaces.read list', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue(null);
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([]);

    await expect(handler.read(agent(), {})).rejects.toMatchObject({
      code: 'AGENT_CAPABILITY_DENIED',
    });
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.policyDenied }),
    );
  });

  it('audits a disabled agent on workspaces.read list', async () => {
    grants.listScopes.mockResolvedValue([
      { scopeType: 'WORKSPACE', scopeId: 'ws-a', revokedAt: null, expiresAt: null },
    ]);
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'workspaces.read',
      revokedAt: null,
      expiresAt: null,
    });
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([
      { scopeType: 'WORKSPACE', scopeId: 'ws-a', resourceType: null, expiresAt: null },
    ]);

    await expect(handler.read({ ...agent(), agentState: 'DISABLED' }, {})).rejects.toMatchObject({
      code: 'AGENT_DISABLED',
    });
    expect(audit.logMachineAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.policyDenied }),
    );
  });
});
