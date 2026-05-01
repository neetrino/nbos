import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { BonusService } from './bonus.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('BonusService', () => {
  let service: BonusService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new BonusService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({ employeeId: 'e1', status: 'ACTIVE', type: 'SALES' });
      expect(prisma.bonusEntry.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates bonus entry', async () => {
      prisma.bonusEntry.create.mockResolvedValue({ id: '1', type: 'SALES', amount: 25000 });
      const result = await service.create({
        employeeId: 'e1',
        orderId: 'o1',
        projectId: 'p1',
        type: 'SALES',
        amount: 25000,
        percent: 10,
      });
      expect(result.type).toBe('SALES');
    });
  });

  describe('updateStatus', () => {
    it('updates status', async () => {
      prisma.bonusEntry.findUnique.mockResolvedValue({ id: '1' });
      prisma.bonusEntry.update.mockResolvedValue({ id: '1', status: 'PAID' });
      const result = await service.updateStatus('1', 'PAID');
      expect(result.status).toBe('PAID');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byStatus');
    });
  });

  describe('getProjectPools', () => {
    it('returns empty when no bonus rows', async () => {
      prisma.bonusEntry.groupBy.mockResolvedValue([]);
      const rows = await service.getProjectPools();
      expect(rows).toEqual([]);
      expect(prisma.project.findMany).not.toHaveBeenCalled();
    });

    it('folds groupBy rows with project metadata', async () => {
      prisma.bonusEntry.groupBy.mockResolvedValue([
        { projectId: 'p1', status: 'ACTIVE', _sum: { amount: new Decimal('100') }, _count: 2 },
        { projectId: 'p1', status: 'PAID', _sum: { amount: new Decimal('50') }, _count: 1 },
      ]);
      prisma.project.findMany.mockResolvedValue([{ id: 'p1', code: 'PR-1', name: 'Alpha' }]);
      const rows = await service.getProjectPools();
      expect(rows).toHaveLength(1);
      expect(rows[0].projectCode).toBe('PR-1');
      expect(rows[0].sumPaidAmount).toBe('50.00');
      expect(rows[0].sumPipelineAmount).toBe('100.00');
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['p1'] } },
        select: { id: true, code: true, name: true },
      });
    });
  });
});
