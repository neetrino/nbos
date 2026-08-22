import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PLATFORM_ORGANIZATION_SCOPE_ID } from '@nbos/shared';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION } from '../ai-platform.constants';
import { AgentGrantService } from './agent-grant.service';

const AGENT_ID = 'agent-1';
const ACTOR_ID = 'emp-admin';

/**
 * Mirrors the `SELECT ... FOR UPDATE` on the agent row plus the locked read that
 * every grant transaction performs before it writes.
 */
function lockAgent(
  prisma: MockPrisma,
  state: { status: string; revokedAt: Date | null; expiresAt?: Date | null },
) {
  prisma.$queryRaw.mockResolvedValue([{ id: AGENT_ID }]);
  prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
    id: AGENT_ID,
    expiresAt: null,
    ...state,
  });
}

describe('AgentGrantService resource scopes', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: AgentGrantService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new AgentGrantService(prisma as never, audit);
    lockAgent(prisma, { status: 'ACTIVE', revokedAt: null });
  });

  it('rejects when scope expiry elapses after the agent lock', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(expiresAt.getTime() + 1));
      try {
        return await fn(prisma);
      } finally {
        vi.useRealTimers();
      }
    });
    await expect(
      service.grantScope(
        { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1', expiresAt },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.externalAgentResourceScope.upsert).not.toHaveBeenCalled();
  });

  it('grants a workspace scope', async () => {
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      ACTOR_ID,
    );

    expect(prisma.externalAgentResourceScope.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          agentId_scopeType_scopeId_resourceType: {
            agentId: AGENT_ID,
            scopeType: 'WORKSPACE',
            scopeId: 'ws-1',
            resourceType: '',
          },
        },
      }),
    );
  });

  it('uses the platform sentinel for organization scope so the unique index holds', async () => {
    await service.grantScope({ agentId: AGENT_ID, scopeType: 'ORGANIZATION' }, ACTOR_ID);

    const where = prisma.externalAgentResourceScope.upsert.mock.calls[0]![0].where;
    expect(where.agentId_scopeType_scopeId_resourceType.scopeId).toBe(
      PLATFORM_ORGANIZATION_SCOPE_ID,
    );
  });

  it('keeps resource scopes of different types apart in the uniqueness key', async () => {
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'RESOURCE', scopeId: 'entity-1', resourceType: 'task' },
      ACTOR_ID,
    );
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'RESOURCE', scopeId: 'entity-1', resourceType: 'FILE' },
      ACTOR_ID,
    );

    const keys = prisma.externalAgentResourceScope.upsert.mock.calls.map(
      (call) => call[0].where.agentId_scopeType_scopeId_resourceType,
    );
    expect(keys[0]!.resourceType).toBe('TASK');
    expect(keys[1]!.resourceType).toBe('FILE');
    expect(keys[0]).not.toEqual(keys[1]);
  });

  it.each(['WORKSPACE', 'PROJECT', 'PRODUCT', 'RESOURCE'] as const)(
    'requires a scopeId for %s scope',
    async (scopeType) => {
      await expect(service.grantScope({ agentId: AGENT_ID, scopeType }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    },
  );

  it('requires a resourceType for RESOURCE scope', async () => {
    await expect(
      service.grantScope({ agentId: AGENT_ID, scopeType: 'RESOURCE', scopeId: 'task-1' }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not store a resourceType for non-resource scopes', async () => {
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1', resourceType: 'TASK' },
      ACTOR_ID,
    );

    const create = prisma.externalAgentResourceScope.upsert.mock.calls[0]![0].create;
    expect(create.resourceType).toBe('');
  });

  it('rejects an oversized reason', async () => {
    await expect(
      service.grantScope(
        { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1', reason: 'x'.repeat(600) },
        ACTOR_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('revokes a scope and audits it', async () => {
    prisma.externalAgentResourceScope.findUnique.mockResolvedValue({
      id: 'scope-1',
      agentId: AGENT_ID,
      scopeType: 'WORKSPACE',
      scopeId: 'ws-1',
      resourceType: null,
      reason: null,
      expiresAt: null,
      revokedAt: null,
      createdAt: new Date(),
    });

    await service.revokeScope('scope-1', ACTOR_ID);

    expect(prisma.externalAgentResourceScope.update).toHaveBeenCalled();
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.scopeRevoked }),
      expect.anything(),
    );
  });

  it('refuses to grant anything to a revoked agent', async () => {
    lockAgent(prisma, { status: 'REVOKED', revokedAt: new Date('2026-08-01T00:00:00.000Z') });

    await expect(
      service.grantScope({ agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.read' }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.externalAgentResourceScope.upsert).not.toHaveBeenCalled();
    expect(prisma.externalAgentCapabilityGrant.upsert).not.toHaveBeenCalled();
  });

  it('reads terminal state inside the lock, so a concurrent revoke cannot be overtaken', async () => {
    // The lock is taken first, so the state this transaction reads is the state
    // a concurrent revoke left behind — not the state seen before the lock.
    prisma.$queryRaw.mockImplementation(async () => {
      prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({
        id: AGENT_ID,
        status: 'REVOKED',
        revokedAt: new Date('2026-08-21T10:00:00.000Z'),
        expiresAt: null,
      });
      return [{ id: AGENT_ID }];
    });

    await expect(
      service.grantScope({ agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.read' }, ACTOR_ID),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.externalAgentResourceScope.upsert).not.toHaveBeenCalled();
    expect(prisma.externalAgentCapabilityGrant.upsert).not.toHaveBeenCalled();
  });

  it('takes the agent lock inside the same transaction as the write', async () => {
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      ACTOR_ID,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const lockedBeforeWrite =
      prisma.$queryRaw.mock.invocationCallOrder[0] <
      prisma.externalAgentResourceScope.upsert.mock.invocationCallOrder[0];
    expect(lockedBeforeWrite).toBe(true);
  });

  it('writes the scope and its audit row through the same transaction client', async () => {
    let transactionClient: unknown;
    prisma.$transaction.mockImplementationOnce(async (run: (tx: unknown) => Promise<unknown>) => {
      transactionClient = prisma;
      return run(prisma);
    });

    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      ACTOR_ID,
    );

    expect(audit.logAdminAction).toHaveBeenCalledWith(expect.anything(), transactionClient);
  });

  it('fails the whole grant when the audit write fails, so the mutation rolls back', async () => {
    vi.mocked(audit.logAdminAction).mockRejectedValueOnce(new Error('audit unavailable'));

    await expect(
      service.grantScope({ agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' }, ACTOR_ID),
    ).rejects.toThrow('audit unavailable');
  });

  it('never writes AI principals into employee resource grants', async () => {
    await service.grantScope(
      { agentId: AGENT_ID, scopeType: 'WORKSPACE', scopeId: 'ws-1' },
      ACTOR_ID,
    );
    await service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.read' }, ACTOR_ID);

    expect(prisma.resourceAccessGrant.create).not.toHaveBeenCalled();
    expect(prisma.resourceAccessGrant.upsert).not.toHaveBeenCalled();
    expect(prisma.resourceAccessGrant.updateMany).not.toHaveBeenCalled();
  });

  it('lists active Work Space scopes from the same grant table', async () => {
    prisma.externalAgentResourceScope.findMany.mockResolvedValue([
      {
        id: 'scope-1',
        agentId: AGENT_ID,
        scopeType: 'WORKSPACE',
        scopeId: 'ws-1',
        resourceType: null,
        reason: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
      },
    ]);

    const scopes = await service.listActiveWorkspaceScopes('ws-1');

    expect(prisma.externalAgentResourceScope.findMany).toHaveBeenCalledWith({
      where: {
        scopeType: 'WORKSPACE',
        scopeId: 'ws-1',
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
      },
      orderBy: { createdAt: 'asc' },
    });
    expect(scopes).toHaveLength(1);
    expect(scopes[0]?.scopeId).toBe('ws-1');
  });

  it('rejects a scope that belongs to another agent or workspace', async () => {
    prisma.externalAgentResourceScope.findUnique.mockResolvedValue({
      id: 'scope-1',
      agentId: 'other-agent',
      scopeType: 'WORKSPACE',
      scopeId: 'ws-2',
    });

    await expect(service.requireScopeOnAgent(AGENT_ID, 'scope-1')).rejects.toThrow(
      'Resource scope not found',
    );
    await expect(service.requireScopeOnWorkspace('ws-1', 'scope-1')).rejects.toThrow(
      'Resource scope not found',
    );
  });
});
