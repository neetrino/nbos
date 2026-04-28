import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@nbos/database';
import { ExpensesService } from './expenses.service';
import { EXPENSE_LIST_MAX_PAGE_SIZE } from './expenses-list-pagination';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

    it('ignores invalid sortBy and defaults order', async () => {
      await service.findAll({ sortBy: 'invalidField', sortOrder: 'desc' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('applies allowed sortBy', async () => {
      await service.findAll({ sortBy: 'amount', sortOrder: 'asc' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: 'asc' },
        }),
      );
    });

    it('caps pageSize at maximum', async () => {
      await service.findAll({ pageSize: 999_999 });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: EXPENSE_LIST_MAX_PAGE_SIZE,
        }),
      );
    });

    it('strips invalid enum query filters', async () => {
      await service.findAll({
        type: 'NOT_A_TYPE',
        category: 'INVALID_CAT',
        status: 'OLD',
        frequency: 'NEVER',
        backlogReason: 'NOT_A_REASON',
      });

      const call = prisma.expense.findMany.mock.calls.at(-1)?.[0] as {
        where?: Record<string, unknown>;
      };
      expect(call?.where).toBeDefined();
      expect(call?.where).not.toHaveProperty('type');
      expect(call?.where).not.toHaveProperty('category');
      expect(call?.where).not.toHaveProperty('status');
      expect(call?.where).not.toHaveProperty('frequency');
      expect(call?.where).not.toHaveProperty('backlogReason');
    });

    it('applies backlogReason filter when valid', async () => {
      await service.findAll({ backlogReason: 'WAITING_DECISION' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ backlogReason: 'WAITING_DECISION' }),
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
        amount: new Decimal(20000),
        expensePayments: [],
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

    it('rejects invalid type', async () => {
      await expect(
        service.create({
          name: 'x',
          type: 'INVALID_TYPE',
          category: 'OTHER',
          amount: 1,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.expense.create).not.toHaveBeenCalled();
    });
  });

  describe('addPayment', () => {
    it('records payment and returns ledger shape', async () => {
      prisma.expense.findUnique.mockResolvedValueOnce({
        id: 'e1',
        amount: new Decimal(100),
        expensePayments: [],
      });
      prisma.expensePayment.create.mockResolvedValue({ id: 'pay1' });
      prisma.expense.findUnique.mockResolvedValueOnce({
        id: 'e1',
        name: 'X',
        amount: new Decimal(100),
        expensePayments: [
          {
            id: 'pay1',
            amount: new Decimal(40),
            paymentDate: new Date('2026-04-28'),
            notes: null,
            createdAt: new Date('2026-04-28'),
          },
        ],
        project: null,
      });

      const result = await service.addPayment('e1', {
        amount: 40,
        paymentDate: '2026-04-28T00:00:00.000Z',
      });

      expect(prisma.expensePayment.create).toHaveBeenCalled();
      expect(result.paymentStatus).toBe('PARTIAL');
      expect(result.paidAmount).toBe('40.00');
      expect(result.remainingAmount).toBe('60.00');
    });

    it('rejects overpayment', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        amount: new Decimal(100),
        expensePayments: [{ amount: new Decimal(90) }],
      });

      await expect(
        service.addPayment('e1', { amount: 20, paymentDate: '2026-04-28T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.expensePayment.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('returns findById shape after update', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Updated',
        amount: new Decimal(100),
        expensePayments: [],
        project: null,
      });
      const result = await service.update('e1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(prisma.expense.update).toHaveBeenCalled();
      expect(prisma.expense.findUnique).toHaveBeenCalled();
    });

    it('rejects invalid category', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'x',
        amount: new Decimal(100),
        expensePayments: [],
        project: null,
      });
      await expect(service.update('e1', { category: 'INVALID' })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.expense.update).not.toHaveBeenCalled();
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
            createdAt: expect.objectContaining({
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

    it('applies status filter to stats scope', async () => {
      await service.getStats({
        status: 'DELAYED',
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      expect(prisma.expense.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DELAYED',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('ignores invalid stats status param', async () => {
      await service.getStats({
        status: 'OLD',
        dateFrom: '2026-04-01T00:00:00.000Z',
        dateTo: '2026-04-30T23:59:59.999Z',
      });

      const groupWhere = prisma.expense.groupBy.mock.calls.at(-1)?.[0] as {
        where?: Record<string, unknown>;
      };
      expect(groupWhere?.where).toBeDefined();
      expect(groupWhere?.where).not.toHaveProperty('status');
    });
  });
});
