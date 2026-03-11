import { describe, it, expect, beforeEach } from 'vitest';
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
});
