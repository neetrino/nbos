import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';
import { materializePayrollBonusAllocationDrafts } from './payroll-bonus-allocation-materialize';
import { PayrollRunsService } from './payroll-runs.service';
import { isPayrollMatrixBonusEntryVisible } from './payroll-bonus-release-base';
import { remainingForBonusEntry } from './payroll-allocation-source-amounts';
import { planPayrollSalaryLines } from './seed-payroll-run-salary-lines';

vi.mock('./payroll-bonus-allocation-materialize', () => ({
  materializePayrollBonusAllocationDrafts: vi.fn(),
}));

const ACTOR = {
  id: 'emp-1',
  permissions: {
    FINANCE_SALARY_VIEW: 'ALL',
    FINANCE_SALARY_ADD: 'ALL',
    FINANCE_SALARY_EDIT: 'ALL',
  },
  departmentIds: [] as string[],
};

const AUGUST_ENTRY = {
  id: 'be-aug',
  type: 'DELIVERY',
  amount: new Decimal('40000.00'),
  payableAmount: new Decimal('40000.00'),
  earnedPeriod: '2026-08',
};

function octoberSettlementLine() {
  return {
    id: 'sl-settle',
    payrollRunId: 'pr-oct',
    employeeId: 'e-term',
    expenseId: null,
    compensationProfileId: null,
    totalPayable: new Decimal('40000.00'),
    baseSalary: new Decimal('0.00'),
    bonusesTotal: new Decimal('40000.00'),
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    employee: {
      id: 'e-term',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
    compensationProfile: null,
    expense: null,
  };
}

function octoberReviewRun() {
  return {
    id: 'pr-oct',
    payrollMonth: '2026-10',
    status: 'REVIEW' as const,
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    updatedAt: new Date('2026-10-01T10:00:00.000Z'),
    approvedAt: null,
    closedAt: null,
    createdBy: null,
    approvedBy: null,
  };
}

describe('P4-S3 October approval of an August unpaid 40000', () => {
  let service: PayrollRunsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PayrollRunsService(prisma as never, { create: vi.fn() } as NotificationService);
    vi.mocked(materializePayrollBonusAllocationDrafts).mockResolvedValue({
      releaseIds: ['rel-aug'],
      carryNotifyEvents: [],
    });
    prisma.payrollRun.update.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.salaryLine.groupBy.mockResolvedValue([{ payrollRunId: 'pr-oct', _count: { _all: 1 } }]);
    prisma.bonusRelease.count.mockResolvedValue(1);
    prisma.bonusRelease.aggregate.mockResolvedValue({
      _sum: { payrollIncludedAmount: new Decimal('40000.00'), amount: new Decimal('40000.00') },
    });
    prisma.bonusRelease.findMany.mockResolvedValue([]);
    prisma.expense.create.mockResolvedValue({ id: 'exp-oct' });
    prisma.salaryLine.update.mockResolvedValue({});
    prisma.salaryLine.findMany.mockResolvedValue([octoberSettlementLine()]);
    prisma.payrollRun.findUnique.mockImplementation(
      (args: { where: { id?: string }; include?: unknown }) => {
        if (args.where.id !== 'pr-oct') return Promise.resolve(null);
        const base = octoberReviewRun();
        if (args.include) {
          return Promise.resolve({
            ...base,
            status: 'APPROVED',
            approvedAt: new Date('2026-10-15T10:00:00.000Z'),
            salaryLines: [octoberSettlementLine()],
          });
        }
        return Promise.resolve(base);
      },
    );
  });

  it('approves the October run and creates one 40000 expense on the zero-salary line', async () => {
    const result = await service.updateStatus(ACTOR, 'pr-oct', 'APPROVED');

    expect(materializePayrollBonusAllocationDrafts).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payrollRunId: 'pr-oct',
        payrollMonth: '2026-10',
      }),
    );
    expect(prisma.payrollRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pr-oct' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      }),
    );
    expect(prisma.expense.create).toHaveBeenCalledTimes(1);
    const expense = prisma.expense.create.mock.calls[0]?.[0] as {
      data: { amount: Decimal; category: string };
    };
    expect(expense.data.amount.toFixed(2)).toBe('40000.00');
    expect(expense.data.category).toBe('BONUS');
    expect(prisma.compensationProfile.create).not.toHaveBeenCalled();
    expect(prisma.salaryLine.create).not.toHaveBeenCalled();
    expect(octoberSettlementLine().baseSalary.toFixed(2)).toBe('0.00');
    expect(result.status).toBe('APPROVED');
    expect(isPayrollMatrixBonusEntryVisible(AUGUST_ENTRY, '2026-10')).toBe(true);
    expect(AUGUST_ENTRY.earnedPeriod).toBe('2026-08');
  });

  it('does not seed a post-fire salary and keeps a repeat 40000 off the remaining', () => {
    const fired = {
      id: 'e-term',
      status: 'TERMINATED',
      firstName: 'Ada',
      lastName: 'Lovelace',
      fireDate: new Date('2026-08-20T12:00:00.000Z'),
    };
    expect(
      planPayrollSalaryLines(
        [fired],
        [
          {
            id: 'p-open',
            employeeId: 'e-term',
            baseSalary: { toString: () => '300000' },
            currency: 'AMD',
            kpiPolicyId: null,
            effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
            effectiveTo: null,
            status: 'ACTIVE' as const,
          },
        ],
        '2026-10',
      ),
    ).toEqual([]);
    expect(
      remainingForBonusEntry({
        entry: AUGUST_ENTRY,
        releases: [
          {
            bonusEntryId: 'be-sep',
            payrollRunId: 'pr-oct',
            status: 'INCLUDED_IN_PAYROLL',
            amount: new Decimal('100000.00'),
          },
        ],
        payrollMonth: '2026-10',
        payrollRunId: 'pr-oct',
      }).toFixed(2),
    ).toBe('40000.00');
    expect(
      remainingForBonusEntry({
        entry: AUGUST_ENTRY,
        releases: [
          {
            bonusEntryId: 'be-aug',
            payrollRunId: 'pr-oct',
            status: 'INCLUDED_IN_PAYROLL',
            amount: new Decimal('40000.00'),
          },
        ],
        payrollMonth: '2026-11',
        payrollRunId: 'pr-nov',
      }).toFixed(2),
    ).toBe('0.00');
  });
});
