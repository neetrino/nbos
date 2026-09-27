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

const ALL = {
  id: 'emp-1',
  permissions: {
    FINANCE_SALARY_VIEW: 'ALL',
    FINANCE_SALARY_ADD: 'ALL',
    FINANCE_SALARY_EDIT: 'ALL',
  },
  departmentIds: [] as string[],
};

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
      const result = await service.findAll(ALL, {});
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
      await service.findAll(ALL, {
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
      const result = await service.findAll(ALL, {});
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

      const result = await service.getStats(ALL, { status: 'APPROVED' });

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

      const result = await service.getStats(ALL, {});

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

      const result = await service.getStats(ALL, {});

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
      const result = await service.getSalaryBoard(ALL, {
        payrollMonthFrom: '2026-02',
        payrollMonthTo: '2026-02',
      });
      expect(result.months).toEqual(['2026-02']);
      expect(result.rows).toEqual([]);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      await expect(service.findById(ALL, 'missing')).rejects.toThrow(NotFoundException);
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
            totalBaseSalary: new Decimal('5000.00'),
            totalBonuses: new Decimal('800.00'),
            totalPayable: new Decimal('5800.00'),
            totalPaid: new Decimal('1000.00'),
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
      const result = await service.findById(ALL, 'p1');
      expect(result).not.toHaveProperty('kpiSalesPlanAmount');
      expect(result).not.toHaveProperty('kpiSalesActualSuggestedAmount');
      expect(result.materializedExpenseLineCount).toBe(2);
      expect(new Decimal(result.totalBaseSalary).eq(new Decimal('5000.00'))).toBe(true);
      expect(new Decimal(result.totalPayable).eq(new Decimal('5800.00'))).toBe(true);
      expect(result.journal).toHaveLength(3);
      expect(result.journal.map((j: { kind: string }) => j.kind)).toEqual([
        'CREATED',
        'APPROVED',
        'CLOSED',
      ]);
    });

    it('replaces stored company totals with scoped salary-line sums for DEPARTMENT', async () => {
      const DEPT = {
        id: 'emp-head',
        permissions: { FINANCE_SALARY_VIEW: 'DEPARTMENT' },
        departmentIds: ['dept-sales'],
      };
      const outsideBase = new Decimal('8000.00');
      const outsideBonus = new Decimal('1500.00');
      const outsidePayable = new Decimal('9500.00');
      const outsidePaid = new Decimal('4000.00');
      const inBase = new Decimal('2000.00');
      const inBonus = new Decimal('300.00');
      const inPayable = new Decimal('2300.00');
      const inPaid = new Decimal('500.00');

      prisma.employeeDepartment.findMany.mockResolvedValue([
        { employeeId: 'emp-in' },
        { employeeId: 'emp-head' },
      ]);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.bonusRelease.count.mockResolvedValue(0);
      prisma.salaryLine.groupBy.mockResolvedValue([{ payrollRunId: 'p1', _count: { _all: 2 } }]);
      prisma.payrollRun.findUnique.mockResolvedValue({
        id: 'p1',
        payrollMonth: '2026-04',
        status: 'REVIEW',
        totalBaseSalary: inBase.plus(outsideBase),
        totalBonuses: inBonus.plus(outsideBonus),
        totalPayable: inPayable.plus(outsidePayable),
        totalPaid: inPaid.plus(outsidePaid),
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-01T10:00:00.000Z'),
        approvedAt: null,
        closedAt: null,
        salaryLines: [
          {
            employeeId: 'emp-in',
            baseSalary: inBase,
            bonusesTotal: inBonus,
            totalPayable: inPayable,
            paidAmount: inPaid,
            expenseId: 'exp-in',
            employee: { id: 'emp-in', firstName: 'In', lastName: 'Dept', email: 'in@x' },
            expense: { id: 'exp-in', name: 'In', amount: 2300, status: 'APPROVED' },
          },
          {
            employeeId: 'emp-out',
            baseSalary: outsideBase,
            bonusesTotal: outsideBonus,
            totalPayable: outsidePayable,
            paidAmount: outsidePaid,
            expenseId: 'exp-out',
            employee: { id: 'emp-out', firstName: 'Out', lastName: 'Dept', email: 'out@x' },
            expense: { id: 'exp-out', name: 'Out', amount: 9500, status: 'APPROVED' },
          },
        ],
        createdBy: null,
        approvedBy: null,
      });

      const result = await service.findById(DEPT, 'p1');

      expect(result.salaryLines.map((line: { employeeId: string }) => line.employeeId)).toEqual([
        'emp-in',
      ]);
      expect(new Decimal(result.totalBaseSalary).eq(inBase)).toBe(true);
      expect(new Decimal(result.totalBonuses).eq(inBonus)).toBe(true);
      expect(new Decimal(result.totalPayable).eq(inPayable)).toBe(true);
      expect(new Decimal(result.totalPaid).eq(inPaid)).toBe(true);
      expect(result.materializedExpenseLineCount).toBe(1);
      expect(new Decimal(result.totalPayable).eq(inPayable.plus(outsidePayable))).toBe(false);
      expect(String(result.totalPayable)).not.toContain('9500');
      expect(String(result.totalBaseSalary)).not.toContain('8000');
    });
  });

  describe('create', () => {
    it('rejects invalid month', async () => {
      await expect(service.create(ALL, { payrollMonth: '2026-13' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects duplicate month', async () => {
      prisma.payrollRun.findUnique.mockResolvedValue({ id: 'existing', payrollMonth: '2026-03' });
      await expect(service.create(ALL, { payrollMonth: '2026-03' })).rejects.toThrow(
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
      await service.updateStatus(ALL, 'run-1', 'REVIEW');

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

      await service.updateStatus(ALL, 'run-1', 'APPROVED');

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
