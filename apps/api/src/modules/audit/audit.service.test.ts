import { describe, it, expect, beforeEach, vi } from 'vitest';
import { actorContextFromMachine } from '@nbos/shared';
import { AuditService } from './audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { attachActorsToAuditLogs } from './audit-actor.resolver';
import { toAuditLogCreateData } from './audit-log-write.mapper';

const HISTORICAL_CREATED_AT = new Date('2026-01-01T00:00:00.000Z');

function historicalHumanRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'log-1',
    projectId: 'proj-1',
    entityType: 'PRODUCT',
    entityId: 'prod-1',
    action: 'delivery.completed',
    userId: 'emp-1',
    actorType: null,
    actorId: null,
    onBehalfOfType: null,
    onBehalfOfId: null,
    channel: null,
    protocol: null,
    correlationId: null,
    clientMetadata: null,
    changes: null,
    ipAddress: null,
    createdAt: HISTORICAL_CREATED_AT,
    ...overrides,
  };
}

describe('AuditService', () => {
  let service: AuditService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuditService(prisma as never);
  });

  describe('log', () => {
    it('should create an audit log entry for a legacy userId write', async () => {
      await service.log({
        entityType: 'credential',
        entityId: 'cred-1',
        action: 'credential.view',
        userId: 'user-1',
        projectId: 'proj-1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'credential',
          entityId: 'cred-1',
          action: 'credential.view',
          userId: 'user-1',
          actorType: 'USER',
          actorId: 'user-1',
          projectId: 'proj-1',
        }),
      });
    });

    it('should handle optional fields', async () => {
      await service.log({
        entityType: 'credential',
        entityId: 'cred-1',
        action: 'credential.create',
        userId: 'user-1',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: undefined,
          changes: undefined,
          ipAddress: undefined,
        }),
      });
    });

    it('should write through an injected transaction client', async () => {
      const tx = { auditLog: { create: vi.fn().mockResolvedValue({ id: 'log-tx' }) } };

      await service.log(
        {
          entityType: 'CALL',
          entityId: 'call-1',
          action: 'CALL_NOTE_UPDATED',
          userId: 'user-1',
        },
        tx,
      );

      expect(tx.auditLog.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should pass changes as JSON after redaction', async () => {
      await service.log({
        entityType: 'credential',
        entityId: 'cred-1',
        action: 'credential.update',
        userId: 'user-1',
        changes: ['name', 'password'],
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: ['name', 'password'],
        }),
      });
    });

    it('writes EXTERNAL_AGENT without a fake employee userId', async () => {
      await service.log({
        entityType: 'Task',
        entityId: 'task-1',
        action: 'tasks.create',
        actor: actorContextFromMachine(
          { id: 'agent-1', type: 'EXTERNAL_AGENT', displayName: 'Cursor Agent' },
          {
            channel: { source: 'rest', protocol: 'http' },
            correlationId: 'corr-1',
            client: { credentialId: 'nbos_ag_ab12', ipAddress: '203.0.113.4' },
          },
        ),
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          actorType: 'EXTERNAL_AGENT',
          actorId: 'agent-1',
          channel: 'rest',
          protocol: 'http',
          correlationId: 'corr-1',
          ipAddress: '203.0.113.4',
          clientMetadata: { credentialId: 'nbos_ag_ab12' },
        }),
      });
    });

    it('writes INTERNAL_AI with onBehalfOf and never stores raw tokens', async () => {
      const data = toAuditLogCreateData({
        entityType: 'AI_AGENT',
        entityId: 'ai-1',
        action: 'internal_ai.lifecycle',
        actor: actorContextFromMachine(
          { id: 'ai-1', type: 'INTERNAL_AI', displayName: 'Support Agent' },
          { onBehalfOf: { id: 'emp-9', type: 'USER' } },
        ),
        changes: { authorization: 'Bearer leaked', apiKey: 'sk-live' },
      });

      expect(data.userId).toBeNull();
      expect(data.actorType).toBe('INTERNAL_AI');
      expect(data.onBehalfOfType).toBe('USER');
      expect(data.onBehalfOfId).toBe('emp-9');
      expect(data.changes).toEqual({
        authorization: '[REDACTED]',
        apiKey: '[REDACTED]',
      });
    });
  });

  describe('findByEntity', () => {
    it('should query with entity filter and pagination', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const result = await service.findByEntity('credential', 'cred-1', { page: 2, pageSize: 10 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityType: 'credential', entityId: 'cred-1' },
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({ total: 0, page: 2, pageSize: 10, totalPages: 0 });
    });

    it('should use default pagination', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findByEntity('credential', 'cred-1');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('should batch-load employee actors for historical user ids', async () => {
      prisma.auditLog.findMany.mockResolvedValue([historicalHumanRow()]);
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.employee.findMany.mockResolvedValue([
        { id: 'emp-1', firstName: 'Sam', lastName: 'Lee' },
      ]);

      const result = await service.findByEntity('PRODUCT', 'prod-1');

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['emp-1'] } },
        select: { id: true, firstName: true, lastName: true },
      });
      expect(result.items[0].actor).toEqual({
        id: 'emp-1',
        type: 'USER',
        displayName: 'Sam Lee',
        firstName: 'Sam',
        lastName: 'Lee',
      });
    });

    it('keeps historical human rows readable when the employee is missing', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        historicalHumanRow({ userId: 'prod-whatsapp-1' }),
      ]);
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.employee.findMany.mockResolvedValue([]);

      const result = await service.findByEntity('PRODUCT', 'prod-1');
      expect(result.items[0].actor).toBeNull();
      expect(result.items[0].userId).toBe('prod-whatsapp-1');
    });
  });

  describe('findByUser', () => {
    it('should query with user filter', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(5);

      const result = await service.findByUser('user-1');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
      expect(result.meta.total).toBe(5);
    });
  });

  describe('findRecentByEntityTypes', () => {
    it('queries the requested entity types', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findRecentByEntityTypes(['EXTERNAL_AGENT', 'AI_MODEL'], {
        page: 1,
        pageSize: 8,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityType: { in: ['EXTERNAL_AGENT', 'AI_MODEL'] } },
          take: 8,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
      );
    });

    it('returns an empty page when no entity types are requested', async () => {
      const result = await service.findRecentByEntityTypes([]);
      expect(result.items).toEqual([]);
      expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
    });

    it('clamps oversized pageSize', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findRecentByEntityTypes(['EXTERNAL_AGENT'], { page: 0, pageSize: 10_000 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100, skip: 0 }),
      );
    });
  });

  describe('findRecentByEntityRefs', () => {
    it('queries the exact entity type and id pairs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.findRecentByEntityRefs([
        { entityType: 'EXTERNAL_AGENT', entityId: 'agent-1' },
        { entityType: 'EXTERNAL_AGENT_CREDENTIAL', entityId: 'cred-1' },
      ]);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { entityType: 'EXTERNAL_AGENT', entityId: 'agent-1' },
              { entityType: 'EXTERNAL_AGENT_CREDENTIAL', entityId: 'cred-1' },
            ],
          },
        }),
      );
    });
  });
});

describe('attachActorsToAuditLogs machine display', () => {
  it('resolves EXTERNAL_AGENT and INTERNAL_AI without Employee rows', async () => {
    const prisma = createMockPrisma();
    const items = await attachActorsToAuditLogs(prisma as never, [
      historicalHumanRow({
        id: 'log-ext',
        userId: null,
        actorType: 'EXTERNAL_AGENT',
        actorId: 'agent-1',
      }),
      historicalHumanRow({
        id: 'log-ai',
        userId: null,
        actorType: 'INTERNAL_AI',
        actorId: 'ai-1',
      }),
      historicalHumanRow({
        id: 'log-sys',
        userId: null,
        actorType: 'SYSTEM',
        actorId: 'system',
      }),
    ]);

    expect(prisma.employee.findMany).not.toHaveBeenCalled();
    expect(items[0].actor).toMatchObject({
      type: 'EXTERNAL_AGENT',
      displayName: 'External Agent',
      firstName: 'External Agent',
    });
    expect(items[1].actor).toMatchObject({
      type: 'INTERNAL_AI',
      displayName: 'Internal AI',
    });
    expect(items[2].actor).toMatchObject({ type: 'SYSTEM', displayName: 'System' });
  });
});
