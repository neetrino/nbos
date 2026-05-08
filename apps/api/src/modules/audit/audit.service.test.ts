import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from './audit.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuditService(prisma as never);
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
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

    it('should pass changes as JSON', async () => {
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

    it('should batch-load employee actors for user ids', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          projectId: 'proj-1',
          entityType: 'PRODUCT',
          entityId: 'prod-1',
          action: 'delivery.completed',
          userId: 'emp-1',
          changes: null,
          ipAddress: null,
          createdAt,
        },
      ]);
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
        firstName: 'Sam',
        lastName: 'Lee',
      });
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
});
