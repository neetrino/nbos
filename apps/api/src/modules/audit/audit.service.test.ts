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
