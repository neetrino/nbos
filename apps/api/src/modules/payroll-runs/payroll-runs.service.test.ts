import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { PayrollRunsService } from './payroll-runs.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';
import { materializePayrollBonusAllocationDrafts } from './payroll-bonus-allocation-materialize';

vi.mock('./payroll-bonus-allocation-materialize', () => ({
  materializePayrollBonusAllocationDrafts: vi.fn(),
}));

describe('PayrollRunsService', () => {
  let service: PayrollRunsService;
  let prisma: MockPrisma;
  let notifications: NotificationService;
  beforeEach(() => {
    prisma = createMockPrisma();
    notifications = { create: vi.fn() } as unknown as NotificationService;
    service = new PayrollRunsService(prisma as never, notifications);
  });

  describe('findAll', () => {
    it('returns paginated envelope', async () => {
      prisma.payrollRun.findMany.mockResolvedValue([
        { id: '1', payrollMonth: '2026-03', _count: { salaryLines: 0 } },
      ]);
      prisma.payrollRun.count.mockResolvedValue(1);
      prisma.salaryLine.groupBy.mockResolvedValue([]);
      const result = await service.findAll({});
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].materializedExpenseLineCount).toBe(0);
      expect(prisma.salaryLine.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            payrollRunId: { in: ['1'] },
            expenseId: { not: null },
          }),
        }),
      );
    });

    it('passes payroll month range to findMany', async () => {
      prisma.payrollRun.findMany.mockResolvedValue([]);
      prisma.payrollRun.count.mockResolvedValue(0);
      prisma.salaryLine.groupBy.mockResolvedValue([]);
      await service.findAll({
        payrollMonthFrom: '2026-01',
        payrollMonthTo: '2026-03',
      });
      expect(prisma.payrollRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            payrollMonth: { gte: '2026-01', lte: '2026-03' },
          },
        }),
      );
    });

    it('adds materializedExpenseLineCount from salary lines with expense_id', async () => {
      prisma.payrollRun.findMany.mockResolvedValue([
        { id: 'r1', payrollMonth: '2026-03', _count: { salaryLines: 5 } },
        { id: 'r2', payrollMonth: '2026-02', _count: { salaryLines: 2 } },
      ]);
      prisma.payrollRun.count.mockResolvedValue(2);
      prisma.salaryLine.groupBy.mockResolvedValue([{ payrollRunId: 'r1', _count: { _all: 3 } }]);
      const result = await service.findAll({});
      expect(result.items[0].materializedExpenseLineCount).toBe(3);
      expect(result.items[1].materializedExpenseLineCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('returns counts and string totals from aggregate', async () => {
      prisma.payrollRun.count.mockResolvedValue(2);
      prisma.payrollRun.aggregate.mockResolvedValue({
        _sum: {
          totalBaseSalary: new Decimal('100.50'),
          totalBonuses: new Decimal('0'),
          totalPayable: new Decimal('90.50'),
          totalPaid: new Decimal('40.00'),
        },
      });
      prisma.payrollRun.groupBy.mockResolvedValue([
        {
          status: 'APPROVED',
          _count: 2,
          _sum: { totalPayable: new Decimal('90.50'), totalPaid: new Decimal('40.00') },
        },
      ]);

      const result = await service.getStats({ status: 'APPROVED' });

      expect(result.runCount).toBe(2);
      expect(result.totals.totalPayable).toBe('90.50');
      expect(result.totals.totalPaid).toBe('40.00');
      expect(result.totals.totalRemaining).toBe('50.50');
      expect(result.byStatus).toHaveLength(1);
      expect(result.byStatus[0].status).toBe('APPROVED');
      expect(result.byStatus[0].runCount).toBe(2);
      expect(result.byStatus[0].totalPayable).toBe('90.50');
      expect(result.byStatus[0].totalPaid).toBe('40.00');
      expect(result.byStatus[0].totalRemaining).toBe('50.50');
      expect(prisma.payrollRun.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'APPROVED' } }),
      );
    });

    it('returns negative totalRemaining when aggregate paid exceeds payable', async () => {
      prisma.payrollRun.count.mockResolvedValue(1);
      prisma.payrollRun.aggregate.mockResolvedValue({
        _sum: {
          totalBaseSalary: new Decimal('0'),
          totalBonuses: new Decimal('0'),
          totalPayable: new Decimal('10.00'),
          totalPaid: new Decimal('25.00'),
        },
      });
      prisma.payrollRun.groupBy.mockResolvedValue([]);

      const result = await service.getStats({});

      expect(result.totals.totalRemaining).toBe('-15.00');
    });

    it('sorts byStatus rows in DRAFT→CLOSED order', async () => {
      prisma.payrollRun.count.mockResolvedValue(2);
      prisma.payrollRun.aggregate.mockResolvedValue({
        _sum: {
          totalBaseSalary: new Decimal('0'),
          totalBonuses: new Decimal('0'),
          totalPayable: new Decimal('100.00'),
          totalPaid: new Decimal('0'),
        },
      });
      prisma.payrollRun.groupBy.mockResolvedValue([
        {
          status: 'CLOSED',
          _count: 1,
          _sum: { totalPayable: new Decimal('60.00'), totalPaid: new Decimal('60.00') },
        },
        {
          status: 'DRAFT',
          _count: 1,
          _sum: { totalPayable: new Decimal('40.00'), totalPaid: new Decimal('0') },
        },
      ]);

      const result = await service.getStats({});

      expect(result.byStatus.map((r) => r.status)).toEqual(['DRAFT', 'CLOSED']);
      expect(result.byStatus[0].totalRemaining).toBe('40.00');
      expect(result.byStatus[1].totalRemaining).toBe('0.00');
    });
  });

  describe('getSalaryBoard', () => {
    it('returns an empty grid when no employees match', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.payrollRun.findMany.mockResolvedValue([]);
      prisma.salaryLine.findMany.mockResolvedValue([]);
      const result = await service.getSalaryBoard({
        payrollMonthFrom: '2026-02',
        payrollMonthTo: '2026-02',
      });
      expect(result.months).toEqual(['2026-02']);
      expect(result.rows).toEqual([]);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns journal derived from durable timestamps', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.salaryLine.groupBy.mockResolvedValue([{ payrollRunId: 'p1', _count: { _all: 2 } }]);
      prisma.payrollRun.findUnique.mockImplementation((args: { where: { id?: string } }) => {
        if (args.where.id === 'p1') {
          return Promise.resolve({
            id: 'p1',
            payrollMonth: '2026-04',
            status: 'CLOSED',
            totalBaseSalary: 0,
            totalBonuses: 0,
            totalPayable: 0,
            totalPaid: 0,
            createdAt: new Date('2026-04-01T10:00:00.000Z'),
            updatedAt: new Date('2026-04-10T10:00:00.000Z'),
            approvedAt: new Date('2026-04-05T12:00:00.000Z'),
            closedAt: new Date('2026-04-06T08:00:00.000Z'),
            salaryLines: [],
            createdBy: { id: 'e1', firstName: 'A', lastName: 'B' },
            approvedBy: { id: 'e2', firstName: 'C', lastName: 'D' },
          });
        }
        return Promise.resolve(null);
      });
      const result = await service.findById('p1');
      expect(result).not.toHaveProperty('kpiSalesPlanAmount');
      expect(result).not.toHaveProperty('kpiSalesActualSuggestedAmount');
      expect(result.materializedExpenseLineCount).toBe(2);
      expect(result.journal).toHaveLength(3);
      expect(result.journal.map((j: { kind: string }) => j.kind)).toEqual([
        'CREATED',
        'APPROVED',
        'CLOSED',
      ]);
    });
  });

  describe('create', () => {
    it('rejects invalid month', async () => {
      await expect(service.create({ payrollMonth: '2026-13' }, 'emp-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate month', async () => {
      prisma.payrollRun.findUnique.mockResolvedValue({ id: 'existing', payrollMonth: '2026-03' });
      await expect(service.create({ payrollMonth: '2026-03' }, 'emp-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    beforeEach(() => {
      vi.mocked(materializePayrollBonusAllocationDrafts).mockResolvedValue({
        releaseIds: [],
        carryNotifyEvents: [],
      });
      prisma.payrollRun.update.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.salaryLine.findMany.mockResolvedValue([]);
      prisma.salaryLine.groupBy.mockResolvedValue([]);
      prisma.bonusRelease.count.mockResolvedValue(0);
      prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: {} });
      prisma.payrollRun.findUnique.mockImplementation(
        (args: { where: { id?: string }; include?: unknown }) => {
          if (args.where.id !== 'run-1') {
            return Promise.resolve(null);
          }
          const base = {
            id: 'run-1',
            payrollMonth: '2026-05',
            status: 'DRAFT',
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
            updatedAt: new Date('2026-05-01T10:00:00.000Z'),
            approvedAt: null,
            closedAt: null,
            createdBy: null,
            approvedBy: null,
          };
          if (args.include) {
            return Promise.resolve({ ...base, salaryLines: [] });
          }
          return Promise.resolve(base);
        },
      );
    });

    it('does not materialize draft allocations when moving Draft to Review', async () => {
      await service.updateStatus('run-1', 'REVIEW', { actorUserId: 'emp-1' });

      expect(materializePayrollBonusAllocationDrafts).not.toHaveBeenCalled();
      expect(prisma.payrollRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'REVIEW' },
      });
    });

    it('materializes draft allocations when moving Review to Approved', async () => {
      prisma.payrollRun.findUnique.mockImplementation(
        (args: { where: { id?: string }; include?: unknown }) => {
          if (args.where.id !== 'run-1') {
            return Promise.resolve(null);
          }
          const base = {
            id: 'run-1',
            payrollMonth: '2026-05',
            status: 'REVIEW',
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
            updatedAt: new Date('2026-05-01T10:00:00.000Z'),
            approvedAt: null,
            closedAt: null,
            createdBy: null,
            approvedBy: null,
          };
          if (args.include) {
            return Promise.resolve({ ...base, salaryLines: [] });
          }
          return Promise.resolve(base);
        },
      );
      prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: {} });
      prisma.salaryLine.findMany.mockResolvedValue([]);
      prisma.salaryLine.update.mockResolvedValue({});
      prisma.expense.create.mockResolvedValue({ id: 'expense-1' });

      await service.updateStatus('run-1', 'APPROVED', {
        actorUserId: 'emp-1',
        approvedById: 'emp-1',
      });

      expect(materializePayrollBonusAllocationDrafts).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          payrollRunId: 'run-1',
          payrollMonth: '2026-05',
          actorUserId: 'emp-1',
        }),
      );
    });
  });
});
