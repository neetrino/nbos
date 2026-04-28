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

    it('applies activeBoard scope when no status filter', async () => {
      await service.findAll({ activeBoard: true });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { notIn: ['PAID', 'DELAYED'] },
          }),
        }),
      );
    });

    it('does not apply activeBoard when status is set', async () => {
      await service.findAll({ activeBoard: true, status: 'PAID' });

      const call = prisma.expense.findMany.mock.calls.at(-1)?.[0] as {
        where?: Record<string, unknown>;
      };
      expect(call?.where?.status).toBe('PAID');
    });

    it('attaches payment ledger fields using grouped payment totals', async () => {
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'e1',
          amount: new Decimal(100),
          project: null,
          expensePlan: null,
          salaryLine: null,
        },
      ]);
      prisma.expensePayment.groupBy.mockResolvedValue([
        { expenseId: 'e1', _sum: { amount: new Decimal(25) } },
      ]);

      const result = await service.findAll({});

      expect(result.items[0]).toMatchObject({
        paidAmount: '25.00',
        remainingAmount: '75.00',
        paymentStatus: 'PARTIAL',
        linkedPayrollRun: null,
        linkedExpensePlan: null,
      });
      expect(prisma.expensePayment.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { expenseId: { in: ['e1'] } },
        }),
      );
    });

    it('includes salary line in findMany for linkedPayrollRun', async () => {
      await service.findAll({});
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            expensePlan: { select: { id: true, name: true } },
            salaryLine: {
              select: {
                id: true,
                payrollRunId: true,
                payrollRun: { select: { payrollMonth: true } },
              },
            },
          }),
        }),
      );
    });

    it('attaches linkedPayrollRun on list items when salary line exists', async () => {
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'e-pay',
          amount: new Decimal(500),
          project: null,
          expensePlan: null,
          salaryLine: {
            id: 'sl-1',
            payrollRunId: 'run-9',
            payrollRun: { payrollMonth: '2026-03' },
          },
        },
      ]);
      prisma.expensePayment.groupBy.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.items[0].linkedPayrollRun).toEqual({
        payrollRunId: 'run-9',
        payrollMonth: '2026-03',
        salaryLineId: 'sl-1',
      });
    });

    it('attaches linkedExpensePlan on list items when plan is linked', async () => {
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'e-plan',
          amount: new Decimal(99),
          project: null,
          expensePlan: { id: 'plan-a', name: 'Internet' },
          salaryLine: null,
        },
      ]);
      prisma.expensePayment.groupBy.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.items[0].linkedExpensePlan).toEqual({ id: 'plan-a', name: 'Internet' });
    });
  });

  describe('findById', () => {
    it('throws NotFoundException', async () => {
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('returns linkedPayrollRun when a salary line links the expense to a payroll run', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Net payroll',
        type: 'PLANNED',
        category: 'OTHER',
        frequency: 'ONE_TIME',
        dueDate: null,
        status: 'THIS_MONTH',
        projectId: null,
        expensePlanId: null,
        isPassThrough: false,
        taxStatus: 'TAX',
        backlogReason: null,
        notes: null,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        amount: new Decimal(1000),
        project: null,
        expensePayments: [],
        expensePlan: null,
        salaryLine: {
          id: 'sl1',
          payrollRunId: 'run1',
          payrollRun: { payrollMonth: '2026-04' },
        },
      });

      const result = await service.findById('e1');

      expect(result.linkedPayrollRun).toEqual({
        payrollRunId: 'run1',
        payrollMonth: '2026-04',
        salaryLineId: 'sl1',
      });
      expect(result.linkedExpensePlan).toBeNull();
    });

    it('returns linkedPayrollRun null when there is no salary line', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e1',
        name: 'Hosting',
        type: 'PLANNED',
        category: 'HOSTING',
        frequency: 'ONE_TIME',
        dueDate: null,
        status: 'THIS_MONTH',
        projectId: null,
        expensePlanId: null,
        isPassThrough: false,
        taxStatus: 'TAX',
        backlogReason: null,
        notes: null,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        amount: new Decimal(100),
        project: null,
        expensePayments: [],
        expensePlan: null,
        salaryLine: null,
      });

      const result = await service.findById('e1');

      expect(result.linkedPayrollRun).toBeNull();
    });

    it('returns linkedExpensePlan when expense plan is linked', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        id: 'e-plan',
        name: 'Internet Apr',
        type: 'PLANNED',
        category: 'TOOLS',
        frequency: 'ONE_TIME',
        dueDate: null,
        status: 'THIS_MONTH',
        projectId: null,
        expensePlanId: 'plan-1',
        isPassThrough: false,
        taxStatus: 'TAX',
        backlogReason: null,
        notes: null,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        amount: new Decimal(50),
        project: null,
        expensePayments: [],
        expensePlan: { id: 'plan-1', name: 'Internet recurring' },
        salaryLine: null,
      });

      const result = await service.findById('e-plan');

      expect(result.linkedExpensePlan).toEqual({ id: 'plan-1', name: 'Internet recurring' });
      expect(result.linkedPayrollRun).toBeNull();
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

  describe('deletePayment', () => {
    it('throws when payment row is missing', async () => {
      prisma.expensePayment.findFirst.mockResolvedValue(null);

      await expect(service.deletePayment('e1', 'pay-missing')).rejects.toThrow(NotFoundException);
      expect(prisma.expensePayment.delete).not.toHaveBeenCalled();
    });

    it('deletes payment and returns ledger shape', async () => {
      prisma.expensePayment.findFirst.mockResolvedValue({
        id: 'pay1',
        expenseId: 'e1',
        amount: new Decimal(10),
      });
      prisma.expensePayment.delete.mockResolvedValue({ id: 'pay1' });
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          amount: new Decimal(100),
          status: 'PAID',
          expensePayments: [],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(100),
          status: 'UNPAID',
          expensePayments: [],
          project: null,
        });

      const result = await service.deletePayment('e1', 'pay1');

      expect(prisma.expensePayment.delete).toHaveBeenCalledWith({ where: { id: 'pay1' } });
      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: { status: 'UNPAID' },
        }),
      );
      expect(result.paymentStatus).toBe('UNPAID');
      expect(result.paidAmount).toBe('0.00');
      expect(result.status).toBe('UNPAID');
    });
  });

  describe('addPayment', () => {
    it('records payment and returns ledger shape', async () => {
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          amount: new Decimal(100),
          status: 'THIS_MONTH',
          expensePayments: [],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          amount: new Decimal(100),
          status: 'THIS_MONTH',
          expensePayments: [
            {
              id: 'pay1',
              amount: new Decimal(40),
              paymentDate: new Date('2026-04-28'),
              notes: null,
              createdAt: new Date('2026-04-28'),
            },
          ],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'X',
          amount: new Decimal(100),
          status: 'THIS_MONTH',
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

      prisma.expensePayment.create.mockResolvedValue({ id: 'pay1' });

      const result = await service.addPayment('e1', {
        amount: 40,
        paymentDate: '2026-04-28T00:00:00.000Z',
      });

      expect(prisma.expensePayment.create).toHaveBeenCalled();
      expect(result.paymentStatus).toBe('PARTIAL');
      expect(result.paidAmount).toBe('40.00');
      expect(result.remainingAmount).toBe('60.00');
    });

    it('sets expense status PAID when payment completes the balance', async () => {
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          amount: new Decimal(100),
          status: 'UNPAID',
          expensePayments: [{ amount: new Decimal(60) }],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          amount: new Decimal(100),
          status: 'UNPAID',
          expensePayments: [{ amount: new Decimal(60) }, { amount: new Decimal(40) }],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Full',
          amount: new Decimal(100),
          status: 'PAID',
          expensePayments: [
            {
              id: 'a',
              amount: new Decimal(60),
              paymentDate: new Date(),
              notes: null,
              createdAt: new Date(),
            },
            {
              id: 'b',
              amount: new Decimal(40),
              paymentDate: new Date(),
              notes: null,
              createdAt: new Date(),
            },
          ],
          project: null,
        });

      prisma.expensePayment.create.mockResolvedValue({ id: 'pay2' });

      const result = await service.addPayment('e1', {
        amount: 40,
        paymentDate: '2026-04-28T00:00:00.000Z',
      });

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: { status: 'PAID' },
        }),
      );
      expect(result.status).toBe('PAID');
      expect(result.paymentStatus).toBe('PAID');
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

    it('rejects amount below sum of recorded payments', async () => {
      const paymentRow = {
        id: 'pay1',
        amount: new Decimal(80),
        paymentDate: new Date('2026-04-01'),
        notes: null,
        createdAt: new Date('2026-04-01'),
      };
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(100),
          status: 'UNPAID',
          expensePayments: [paymentRow],
          project: null,
        })
        .mockResolvedValueOnce({
          expensePayments: [{ amount: new Decimal(80) }],
        });

      await expect(service.update('e1', { amount: 50 })).rejects.toThrow(BadRequestException);
      expect(prisma.expense.update).not.toHaveBeenCalled();
    });

    it('allows amount equal to sum of payments', async () => {
      const paymentRow = {
        id: 'pay1',
        amount: new Decimal(80),
        paymentDate: new Date('2026-04-01'),
        notes: null,
        createdAt: new Date('2026-04-01'),
      };
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(100),
          status: 'UNPAID',
          expensePayments: [paymentRow],
          project: null,
        })
        .mockResolvedValueOnce({
          expensePayments: [{ amount: new Decimal(80) }],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(80),
          status: 'UNPAID',
          expensePayments: [paymentRow],
          project: null,
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(80),
          status: 'PAID',
          expensePayments: [paymentRow],
          project: null,
        });

      await service.update('e1', { amount: 80 });

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: expect.objectContaining({ amount: 80 }),
        }),
      );
      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: { status: 'PAID' },
        }),
      );
    });

    it('demotes PAID status when amount increases above recorded payments', async () => {
      const pay40 = {
        id: 'pay-a',
        amount: new Decimal(40),
        paymentDate: new Date('2026-04-01'),
        notes: null,
        createdAt: new Date('2026-04-01'),
      };
      const pay60 = {
        id: 'pay-b',
        amount: new Decimal(60),
        paymentDate: new Date('2026-04-02'),
        notes: null,
        createdAt: new Date('2026-04-02'),
      };
      prisma.expense.findUnique
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(100),
          status: 'PAID',
          expensePayments: [pay40, pay60],
          project: null,
        })
        .mockResolvedValueOnce({
          expensePayments: [{ amount: new Decimal(40) }, { amount: new Decimal(60) }],
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(150),
          status: 'PAID',
          expensePayments: [pay40, pay60],
          project: null,
        })
        .mockResolvedValueOnce({
          id: 'e1',
          name: 'Rent',
          amount: new Decimal(150),
          status: 'UNPAID',
          expensePayments: [pay40, pay60],
          project: null,
        });

      await service.update('e1', { amount: 150 });

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: expect.objectContaining({ amount: 150 }),
        }),
      );
      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: { status: 'UNPAID' },
        }),
      );
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
