import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { AiPlatformAuditService } from '../ai-platform-audit.service';
import { AI_AUDIT_ACTION, AI_AUDIT_ENTITY } from '../ai-platform.constants';
import { ExternalAgentService } from './external-agent.service';

const OWNER_ID = 'emp-owner';
const ACTOR_ID = 'emp-admin';

function agentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-1',
    name: 'Cursor Agent',
    description: null,
    status: 'ACTIVE',
    ownerId: OWNER_ID,
    createdById: ACTOR_ID,
    expiresAt: null,
    disabledAt: null,
    revokedAt: null,
    lastUsedAt: null,
    lastUsedIp: null,
    lastUsedChannel: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Mirrors `SELECT ... FOR UPDATE` followed by the locked read. */
function lockRow(prisma: MockPrisma, row: ReturnType<typeof agentRow>) {
  prisma.$queryRaw.mockResolvedValue([{ id: row.id }]);
  prisma.externalAgent.findUniqueOrThrow.mockResolvedValue(row);
}

describe('ExternalAgentService', () => {
  let prisma: MockPrisma;
  let audit: AiPlatformAuditService;
  let service: ExternalAgentService;

  beforeEach(() => {
    prisma = createMockPrisma();
    audit = {
      logAdminAction: vi.fn(),
      logMachineAction: vi.fn(),
    } as unknown as AiPlatformAuditService;
    service = new ExternalAgentService(prisma as never, audit);
    prisma.employee.findUnique.mockResolvedValue({ id: OWNER_ID });
  });

  describe('create', () => {
    it('persists an agent and audits the lifecycle event', async () => {
      prisma.externalAgent.create.mockResolvedValue(agentRow());

      const agent = await service.create({ name: '  Cursor Agent  ', ownerId: OWNER_ID }, ACTOR_ID);

      expect(prisma.externalAgent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Cursor Agent',
          ownerId: OWNER_ID,
          createdById: ACTOR_ID,
        }),
      });
      expect(agent.state).toBe('ACTIVE');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AI_AUDIT_ENTITY.agent,
          action: AI_AUDIT_ACTION.agentCreated,
          actingEmployeeId: ACTOR_ID,
        }),
        prisma,
      );
    });

    it('rejects a blank or oversized name', async () => {
      await expect(service.create({ name: '   ', ownerId: OWNER_ID }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.create({ name: 'x'.repeat(200), ownerId: OWNER_ID }, ACTOR_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown owner', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(service.create({ name: 'Agent', ownerId: 'ghost' }, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.externalAgent.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('reactivates a stored EXPIRED agent when expiry is extended', async () => {
      const nextExpiry = new Date('2026-12-01T00:00:00.000Z');
      lockRow(
        prisma,
        agentRow({ status: 'EXPIRED', expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
      );
      prisma.externalAgent.update.mockResolvedValue(
        agentRow({ status: 'ACTIVE', expiresAt: nextExpiry }),
      );

      const agent = await service.update('agent-1', { expiresAt: nextExpiry }, ACTOR_ID);

      expect(prisma.externalAgent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: expect.objectContaining({ expiresAt: nextExpiry, status: 'ACTIVE' }),
      });
      expect(agent.state).toBe('ACTIVE');
    });
  });

  describe('revoke', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow());
      prisma.externalAgent.update.mockResolvedValue(
        agentRow({ status: 'REVOKED', revokedAt: new Date('2026-08-21T00:00:00.000Z') }),
      );
    });

    it('revokes every outstanding credential in the same transaction', async () => {
      const agent = await service.revoke('agent-1', ACTOR_ID);

      expect(prisma.externalAgentCredential.updateMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-1', revokedAt: null },
        data: expect.objectContaining({ revokedById: ACTOR_ID }),
      });
      expect(agent.state).toBe('REVOKED');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: AI_AUDIT_ACTION.agentRevoked }),
        prisma,
      );
    });

    it('is idempotent and does not re-audit an already revoked agent', async () => {
      lockRow(prisma, agentRow({ status: 'REVOKED', revokedAt: new Date('2026-08-10T00:00:00Z') }));

      const agent = await service.revoke('agent-1', ACTOR_ID);

      expect(agent.state).toBe('REVOKED');
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('fails for an unknown agent', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      await expect(service.revoke('missing', ACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('disable and enable', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow());
    });

    it('disables an agent and records disabledAt', async () => {
      prisma.externalAgent.update.mockResolvedValue(agentRow({ status: 'DISABLED' }));

      const agent = await service.disable('agent-1', ACTOR_ID);

      expect(prisma.externalAgent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: expect.objectContaining({ status: 'DISABLED' }),
      });
      expect(agent.state).toBe('DISABLED');
    });

    it('locks the agent row before it reads lifecycle state', async () => {
      prisma.externalAgent.update.mockResolvedValue(agentRow());

      await service.enable('agent-1', ACTOR_ID);

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const lockedBeforeRead =
        prisma.$queryRaw.mock.invocationCallOrder[0] <
        prisma.externalAgent.findUniqueOrThrow.mock.invocationCallOrder[0];
      expect(lockedBeforeRead).toBe(true);
    });
  });

  describe('lifecycle mutations and their audit rows commit together', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow());
      prisma.externalAgent.create.mockResolvedValue(agentRow());
      prisma.externalAgent.update.mockResolvedValue(agentRow());
    });

    it.each([
      [
        'create',
        (target: ExternalAgentService) => target.create({ name: 'A', ownerId: OWNER_ID }, ACTOR_ID),
      ],
      [
        'update',
        (target: ExternalAgentService) => target.update('agent-1', { name: 'B' }, ACTOR_ID),
      ],
      ['disable', (target: ExternalAgentService) => target.disable('agent-1', ACTOR_ID)],
      ['enable', (target: ExternalAgentService) => target.enable('agent-1', ACTOR_ID)],
      ['revoke', (target: ExternalAgentService) => target.revoke('agent-1', ACTOR_ID)],
    ])('%s writes its audit row through the transaction client', async (_label, act) => {
      await act(service);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.anything(), prisma);
    });

    it.each([
      [
        'create',
        (target: ExternalAgentService) => target.create({ name: 'A', ownerId: OWNER_ID }, ACTOR_ID),
      ],
      [
        'update',
        (target: ExternalAgentService) => target.update('agent-1', { name: 'B' }, ACTOR_ID),
      ],
      ['disable', (target: ExternalAgentService) => target.disable('agent-1', ACTOR_ID)],
      ['enable', (target: ExternalAgentService) => target.enable('agent-1', ACTOR_ID)],
      ['revoke', (target: ExternalAgentService) => target.revoke('agent-1', ACTOR_ID)],
    ])('%s fails when the audit write fails, so the mutation rolls back', async (_label, act) => {
      vi.mocked(audit.logAdminAction).mockRejectedValueOnce(new Error('audit unavailable'));

      await expect(act(service)).rejects.toThrow('audit unavailable');
    });
  });

  describe('revocation is terminal', () => {
    beforeEach(() => {
      lockRow(prisma, agentRow({ status: 'REVOKED', revokedAt: new Date('2026-08-10T00:00:00Z') }));
    });

    it.each([
      ['disable', (target: ExternalAgentService) => target.disable('agent-1', ACTOR_ID)],
      ['enable', (target: ExternalAgentService) => target.enable('agent-1', ACTOR_ID)],
      [
        'update',
        (target: ExternalAgentService) => target.update('agent-1', { name: 'Renamed' }, ACTOR_ID),
      ],
    ])('refuses to %s a revoked agent', async (_label, act) => {
      await expect(act(service)).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('refuses a transition for an agent revoked behind an ACTIVE status column', async () => {
      lockRow(prisma, agentRow({ status: 'ACTIVE', revokedAt: new Date('2026-08-10T00:00:00Z') }));

      await expect(service.enable('agent-1', ACTOR_ID)).rejects.toThrow(BadRequestException);
      expect(prisma.externalAgent.update).not.toHaveBeenCalled();
    });

    it('reports REVOKED even if the status column was walked back', async () => {
      prisma.externalAgent.findUnique.mockResolvedValue(
        agentRow({ status: 'ACTIVE', revokedAt: new Date('2026-08-10T00:00:00.000Z') }),
      );

      const agent = await service.findById('agent-1');

      expect(agent?.state).toBe('REVOKED');
    });
  });

  describe('resolveDisplayNames', () => {
    it('batches lookups into a single query', async () => {
      prisma.externalAgent.findMany.mockResolvedValue([
        { id: 'agent-1', name: 'Cursor Agent' },
        { id: 'agent-2', name: 'Codex Agent' },
      ]);

      const names = await service.resolveDisplayNames(['agent-1', 'agent-2']);

      expect(prisma.externalAgent.findMany).toHaveBeenCalledTimes(1);
      expect(names.get('agent-1')).toBe('Cursor Agent');
      expect(names.get('agent-2')).toBe('Codex Agent');
    });

    it('skips the query when there is nothing to resolve', async () => {
      const names = await service.resolveDisplayNames([]);
      expect(names.size).toBe(0);
      expect(prisma.externalAgent.findMany).not.toHaveBeenCalled();
    });
  });

  it('never exposes credential material in the agent projection', async () => {
    prisma.externalAgent.findUnique.mockResolvedValue(agentRow());
    const agent = await service.findById('agent-1');
    expect(agent).not.toBeNull();
    expect(Object.keys(agent!)).not.toContain('secretHash');
  });
});
