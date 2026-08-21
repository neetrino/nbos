import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { AgentGrantService } from './agent-grant.service';

const AGENT_ID = 'agent-1';
const ACTOR_ID = 'emp-admin';

/**
 * Mirrors the `SELECT ... FOR UPDATE` on the agent row plus the locked read that
 * every grant transaction performs before it writes.
 */
function lockAgent(prisma: MockPrisma, state: { status: string; revokedAt: Date | null }) {
  prisma.$queryRaw.mockResolvedValue([{ id: AGENT_ID }]);
  prisma.externalAgent.findUniqueOrThrow.mockResolvedValue({ id: AGENT_ID, ...state });
}

describe('AgentGrantService capability grants', () => {
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

  it('grants a registered capability and audits it', async () => {
    await service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.read' }, ACTOR_ID);

    expect(prisma.externalAgentCapabilityGrant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { agentId_capabilityKey: { agentId: AGENT_ID, capabilityKey: 'tasks.read' } },
      }),
    );
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: AI_AUDIT_ENTITY.capabilityGrant,
        action: AI_AUDIT_ACTION.capabilityGranted,
      }),
      expect.anything(),
    );
  });

  it.each(['tasks.delete', 'tasks.set_status', 'tasks.force_complete', 'not.real'])(
    'refuses to grant unregistered capability %s',
    async (capabilityKey) => {
      await expect(
        service.grantCapability({ agentId: AGENT_ID, capabilityKey }, ACTOR_ID),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgentCapabilityGrant.upsert).not.toHaveBeenCalled();
    },
  );

  it('treats tasks.create and tasks.update as independent grants', async () => {
    await service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.create' }, ACTOR_ID);
    await service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.update' }, ACTOR_ID);

    const keys = prisma.externalAgentCapabilityGrant.upsert.mock.calls.map(
      (call) => call[0].where.agentId_capabilityKey.capabilityKey,
    );
    expect(keys).toEqual(['tasks.create', 'tasks.update']);
  });

  it('re-granting clears a previous revocation', async () => {
    await service.grantCapability({ agentId: AGENT_ID, capabilityKey: 'tasks.read' }, ACTOR_ID);

    const update = prisma.externalAgentCapabilityGrant.upsert.mock.calls[0]![0].update;
    expect(update).toMatchObject({ revokedAt: null, revokedById: null });
  });

  it('fails for an unknown agent', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(
      service.grantCapability({ agentId: 'ghost', capabilityKey: 'tasks.read' }, ACTOR_ID),
    ).rejects.toThrow(NotFoundException);
  });

  it('revokes an existing grant and audits it', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      id: 'grant-1',
      agentId: AGENT_ID,
      capabilityKey: 'tasks.read',
      reason: null,
      expiresAt: null,
      revokedAt: null,
      createdAt: new Date(),
    });

    await service.revokeCapability(AGENT_ID, 'tasks.read', ACTOR_ID);

    expect(prisma.externalAgentCapabilityGrant.update).toHaveBeenCalled();
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: AI_AUDIT_ACTION.capabilityRevoked }),
      expect.anything(),
    );
  });

  it('is idempotent when revoking twice', async () => {
    prisma.externalAgentCapabilityGrant.findUnique.mockResolvedValue({
      id: 'grant-1',
      agentId: AGENT_ID,
      capabilityKey: 'tasks.read',
      reason: null,
      expiresAt: null,
      revokedAt: new Date('2026-08-01T00:00:00.000Z'),
      createdAt: new Date(),
    });

    await service.revokeCapability(AGENT_ID, 'tasks.read', ACTOR_ID);

    expect(prisma.externalAgentCapabilityGrant.update).not.toHaveBeenCalled();
    expect(audit.logAdminAction).not.toHaveBeenCalled();
  });
});
