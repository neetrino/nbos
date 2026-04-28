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

    it('applies createdAt date range filter', async () => {
      await service.findAll({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates expense and returns findById shape', async () => {
      prisma.expense.create.mockResolvedValue({ id: '1' });
      prisma.expense.findUnique.mockResolvedValue({
        id: '1',
        name: 'Hosting',
        amount: 20000,
        project: null,
      });
      const result = await service.create({
        name: 'Hosting',
        type: 'PLANNED',
        category: 'HOSTING',
        amount: 20000,
      });
      expect(result.name).toBe('Hosting');
      expect(prisma.expense.findUnique).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('returns findById shape after update', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Updated',
        amount: 100,
        project: null,
      });
      const result = await service.update('e1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(prisma.expense.update).toHaveBeenCalled();
      expect(prisma.expense.findUnique).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      const stats = await service.getStats();
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('byStatus');
    });

    it('applies date filters to stats queries', async () => {
      await service.getStats({
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.expense.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
      expect(prisma.expense.aggregate).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PAID',
            paidDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('applies projectId to stats queries', async () => {
      await service.getStats({ projectId: 'proj-a' });

      expect(prisma.expense.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'proj-a' }),
        }),
      );
      expect(prisma.expense.aggregate.mock.calls.length).toBeGreaterThanOrEqual(3);
      for (const call of prisma.expense.aggregate.mock.calls) {
        expect(call[0]).toEqual(
          expect.objectContaining({
            where: expect.objectContaining({ projectId: 'proj-a' }),
          }),
        );
      }
    });
  });
});
