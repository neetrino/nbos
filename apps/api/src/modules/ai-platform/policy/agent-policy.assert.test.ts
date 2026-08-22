import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AgentAccessException } from '../auth/agent-auth.errors';
import { AgentPolicyService, type AgentPolicyQuery } from './agent-policy.service';

const ACTOR = actorContextFromMachine({
  id: 'agent-1',
  type: 'EXTERNAL_AGENT',
  displayName: 'Cursor Agent',
});

function query(overrides: Partial<AgentPolicyQuery> = {}): AgentPolicyQuery {
  return {
    actor: ACTOR,
    agentState: 'ACTIVE',
    credentialState: 'ACTIVE',
    capabilityKey: 'tasks.read',
    target: { workspaceId: 'ws-1' },
    ...overrides,
  };
}

describe('AgentPolicyService.assertAllowed', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AgentPolicyService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AgentPolicyService(prisma as never, audit);
  });

  it('returns the allow decision without auditing a denial', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'tasks.read',
      revokedAt: null,
      expiresAt: null,
    });
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([
      { scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null },
    ]);

    const decision = await service.assertAllowed(query());

    expect(decision.outcome).toBe('ALLOW');
    expect(audit.logMachineAction).not.toHaveBeenCalled();
  });

  it('throws a safe error and audits the denial with the machine actor', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue(null);
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([]);

    await expect(service.assertAllowed(query())).rejects.toThrow(AgentAccessException);

    const auditCall = vi.mocked(audit.logMachineAction).mock.calls[0]![0];
    expect(auditCall.action).toBe(AI_AUDIT_ACTION.policyDenied);
    expect(auditCall.actor.actor.type).toBe('EXTERNAL_AGENT');
  });

  it('does not leak whether the out-of-scope resource exists', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'tasks.read',
      revokedAt: null,
      expiresAt: null,
    });
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([]);

    await expect(
      service.assertAllowed(query({ target: { workspaceId: 'ws-foreign' } })),
    ).rejects.toMatchObject({ code: 'AGENT_RESOURCE_NOT_AVAILABLE' });
  });

  it('does not audit rate-limit denials', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'tasks.read',
      revokedAt: null,
      expiresAt: null,
    });
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([
      { scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null },
    ]);

    await expect(service.assertAllowed(query({ rateLimitExceeded: true }))).rejects.toMatchObject({
      code: 'AGENT_RATE_LIMITED',
    });
    expect(audit.logMachineAction).not.toHaveBeenCalled();
  });

  it('answers a throttled agent the same way in and out of scope', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'tasks.read',
      revokedAt: null,
      expiresAt: null,
    });
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([
      { scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null },
    ]);

    const inScope = await service
      .assertAllowed(query({ rateLimitExceeded: true }))
      .catch((error: AgentAccessException) => error);
    const outOfScope = await service
      .assertAllowed(query({ rateLimitExceeded: true, target: { workspaceId: 'ws-foreign' } }))
      .catch((error: AgentAccessException) => error);

    expect((inScope as AgentAccessException).getResponse()).toEqual(
      (outOfScope as AgentAccessException).getResponse(),
    );
  });

  it('keeps the safe deterministic error when the denial audit fails', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue(null);
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([]);
    vi.mocked(audit.logMachineAction).mockRejectedValue(new Error('audit unavailable'));

    await expect(service.assertAllowed(query())).rejects.toMatchObject({
      code: 'AGENT_CAPABILITY_DENIED',
    });
  });
});
