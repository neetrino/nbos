import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actorContextFromEmployee, actorContextFromMachine } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
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

describe('AgentPolicyService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AgentPolicyService;

  function grantExists(capabilityKey = 'tasks.read'): void {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey,
      revokedAt: null,
      expiresAt: null,
    });
  }

  function scopesFor(scopes: Array<Record<string, unknown>>): void {
    prisma.externalAgentResourceScope.findMany.mockResolvedValue(scopes);
  }

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AgentPolicyService(prisma as never, audit);
  });

  it('allows a granted capability inside a granted workspace', async () => {
    grantExists();
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query());

    expect(decision.outcome).toBe('ALLOW');
  });

  it('denies deny-by-default when no grant row exists', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue(null);
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query());

    expect(decision).toEqual({ outcome: 'DENY', reason: 'CAPABILITY_NOT_GRANTED' });
  });

  it('denies a cross-workspace request', async () => {
    grantExists();
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query({ target: { workspaceId: 'ws-foreign' } }));

    expect(decision).toEqual({ outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' });
  });

  it('ignores scopes whose expiry has elapsed', async () => {
    grantExists();
    scopesFor([
      {
        scopeType: 'WORKSPACE',
        scopeId: 'ws-1',
        resourceType: null,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    ]);

    const decision = await service.evaluate(query());

    expect(decision).toEqual({ outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' });
  });

  it('only loads scopes that are not revoked', async () => {
    grantExists();
    scopesFor([]);

    await service.evaluate(query());

    expect(prisma.externalAgentResourceScope.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { agentId: 'agent-1', revokedAt: null } }),
    );
  });

  it('denies a revoked grant', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      capabilityKey: 'tasks.read',
      revokedAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: null,
    });
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query());

    expect(decision).toEqual({ outcome: 'DENY', reason: 'CAPABILITY_GRANT_REVOKED' });
  });

  it('denies an unknown capability even when a grant row exists for it', async () => {
    grantExists('tasks.delete');
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query({ capabilityKey: 'tasks.delete' }));

    expect(decision).toEqual({ outcome: 'DENY', reason: 'CAPABILITY_UNKNOWN' });
  });

  it('denies a disabled agent regardless of grants', async () => {
    grantExists();
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query({ agentState: 'DISABLED' }));

    expect(decision).toEqual({ outcome: 'DENY', reason: 'AGENT_DISABLED' });
  });

  it('denies a revoked credential regardless of grants', async () => {
    grantExists();
    scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

    const decision = await service.evaluate(query({ credentialState: 'REVOKED' }));

    expect(decision).toEqual({ outcome: 'DENY', reason: 'CREDENTIAL_REVOKED' });
  });

  describe('principal binding', () => {
    it('loads grants and scopes for the authenticated actor, never a supplied id', async () => {
      grantExists();
      scopesFor([]);

      await service.evaluate(query());

      expect(prisma.externalAgentCapabilityGrant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agentId_capabilityKey: { agentId: 'agent-1', capabilityKey: 'tasks.read' } },
        }),
      );
      expect(prisma.externalAgentResourceScope.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { agentId: 'agent-1', revokedAt: null } }),
      );
    });

    it('never evaluates one agent against another agent permissions', async () => {
      const otherActor = actorContextFromMachine({
        id: 'agent-2',
        type: 'EXTERNAL_AGENT',
        displayName: 'Codex Agent',
      });
      grantExists();
      scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: null, expiresAt: null }]);

      await service.evaluate(query({ actor: otherActor }));

      expect(prisma.externalAgentCapabilityGrant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agentId_capabilityKey: { agentId: 'agent-2', capabilityKey: 'tasks.read' } },
        }),
      );
    });

    it.each([
      ['an employee', actorContextFromEmployee({ id: 'emp-1', firstName: 'Ann', lastName: 'Lee' })],
      [
        'an internal AI actor, which has no external grant table',
        actorContextFromMachine({
          id: 'internal-1',
          type: 'INTERNAL_AI',
          displayName: 'Internal AI',
        }),
      ],
    ])('denies %s before reading any grant state', async (_label, actor) => {
      const decision = await service.evaluate(query({ actor }));

      expect(decision).toEqual({ outcome: 'DENY', reason: 'ACTOR_NOT_SUPPORTED' });
      expect(prisma.externalAgentCapabilityGrant.findUnique).not.toHaveBeenCalled();
      expect(prisma.externalAgentResourceScope.findMany).not.toHaveBeenCalled();
    });
  });

  describe('resource scope shape', () => {
    it('treats the stored empty resourceType as absent when matching', async () => {
      grantExists();
      scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: '', expiresAt: null }]);

      const decision = await service.evaluate(query());

      expect(decision.outcome).toBe('ALLOW');
    });

    it('matches a RESOURCE scope only for its own resource type', async () => {
      grantExists();
      scopesFor([
        { scopeType: 'RESOURCE', scopeId: 'entity-1', resourceType: 'TASK', expiresAt: null },
      ]);

      const allowed = await service.evaluate(
        query({ target: { resourceType: 'TASK', resourceId: 'entity-1' } }),
      );
      const denied = await service.evaluate(
        query({ target: { resourceType: 'FILE', resourceId: 'entity-1' } }),
      );

      expect(allowed.outcome).toBe('ALLOW');
      expect(denied).toEqual({ outcome: 'DENY', reason: 'RESOURCE_OUT_OF_SCOPE' });
    });

    it('resolves an Extension WORKSPACE grant to the Product Work Space before matching', async () => {
      grantExists();
      scopesFor([{ scopeType: 'WORKSPACE', scopeId: 'ws-ext', resourceType: '', expiresAt: null }]);
      prisma.workSpace.findUnique.mockResolvedValue({
        id: 'ws-ext',
        name: 'Ext',
        type: 'EXTENSION_DELIVERY',
        projectId: 'proj-1',
        productId: null,
        extensionId: 'ext-1',
        scrumEnabled: false,
      });
      prisma.extension.findUnique.mockResolvedValue({ productId: 'prod-1' });
      prisma.workSpace.findFirst.mockResolvedValue({
        id: 'ws-product',
        name: 'Product',
        type: 'PRODUCT_DELIVERY',
        projectId: 'proj-1',
        productId: 'prod-1',
        extensionId: null,
        scrumEnabled: true,
      });

      const decision = await service.evaluate(
        query({ target: { workspaceId: 'ws-product', productId: 'prod-1' } }),
      );

      expect(decision.outcome).toBe('ALLOW');
    });
  });
});
