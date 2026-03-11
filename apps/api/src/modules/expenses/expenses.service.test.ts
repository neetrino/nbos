import { describe, it, expect, beforeEach } from 'vitest';
import { ExpensesService } from './expenses.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { NotFoundException } from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ExpensesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
    });

    it('applies filters', async () => {
      await service.findAll({
        type: 'PLANNED',
        category: 'HOSTING',
        status: 'PAID',
        projectId: 'p1',
      });
      expect(prisma.expense.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates expense', async () => {
      prisma.expense.create.mockResolvedValue({ id: '1', name: 'Hosting', amount: 20000 });
      const result = await service.create({
        name: 'Hosting',
        type: 'PLANNED',
        category: 'HOSTING',
        amount: 20000,
      });
      expect(result.name).toBe('Hosting');
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byCategory');
    });
  });
});
