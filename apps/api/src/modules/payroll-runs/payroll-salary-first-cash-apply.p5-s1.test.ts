import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import {
  assignableBonusesFromReleases,
  fullyPaidAttributedReleaseIds,
  preparePayrollCashPayment,
} from './payroll-salary-first-cash-apply';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
  PAYROLL_CASH_ERRORS,
} from './payroll-salary-first-cash';
import { syncSalaryLinePaidFromExpenseLedger } from './payroll-salary-line-ledger-sync';

const SALARY = new Decimal('300000.00');
const BONUS_60 = new Decimal('60000.00');
const BONUS_40 = new Decimal('40000.00');

function includedRelease(id: string, amount: Decimal) {
  return {
    id,
    amount,
    payrollIncludedAmount: amount,
    status: 'INCLUDED_IN_PAYROLL',
  };
}

function encoded320kNotes(): string {
  const allocation = allocateSalaryFirstCash({
    cash: new Decimal('320000.00'),
    salaryRemaining: SALARY,
    bonuses: [
      { bonusReleaseId: 'rel-60', remaining: BONUS_60 },
      { bonusReleaseId: 'rel-40', remaining: BONUS_40 },
    ],
    assignments: parsePayrollCashBonusAssignments([
      { bonusReleaseId: 'rel-60', amount: '20000.00' },
    ]),
  });
  return encodePayrollCashNotes(allocation, { idempotencyKey: 'pay-320' });
}

describe('P5-S1 explicit bonus cash attribution', () => {
  it('does not mark the 60000 bonus PAID after 20000 attributed cash', () => {
    const notes = encoded320kNotes();
    const ids = fullyPaidAttributedReleaseIds(
      [includedRelease('rel-60', BONUS_60), includedRelease('rel-40', BONUS_40)],
      [{ amount: new Decimal('320000.00'), notes }],
    );
    expect(ids).toEqual([]);
  });

  it('ignores a DRAFT release when remaining bonus cash is assigned', () => {
    const bonuses = assignableBonusesFromReleases(
      [
        { ...includedRelease('rel-60', BONUS_60), status: 'DRAFT' },
        includedRelease('rel-40', BONUS_40),
      ],
      [],
    );
    expect(bonuses.map((row) => row.bonusReleaseId)).toEqual(['rel-40']);
  });

  it('replays the same payment key without allocating cash twice', () => {
    const input = {
      cash: new Decimal('320000.00'),
      alreadyPaidCash: new Decimal('320000.00'),
      baseSalary: SALARY,
      releases: [includedRelease('rel-60', BONUS_60), includedRelease('rel-40', BONUS_40)],
      existingPayments: [
        { id: 'pay-1', amount: new Decimal('320000.00'), notes: encoded320kNotes() },
      ],
      assignments: [{ bonusReleaseId: 'rel-60', amount: '20000.00' }],
      idempotencyKey: 'pay-320',
    };
    const first = preparePayrollCashPayment(input);
    const second = preparePayrollCashPayment(input);
    expect(first.existingPayment?.id).toBe('pay-1');
    expect(second.existingPayment?.id).toBe('pay-1');
    expect(second.allocation.bonusCash.toFixed(2)).toBe('20000.00');
  });
});

describe('P5-S1 expense payment write path', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    prisma.salaryLine.findUnique.mockResolvedValue({
      id: 'sl-1',
      payrollRunId: 'pr-1',
      employeeId: 'emp-1',
      baseSalary: SALARY,
      totalPayable: new Decimal('400000.00'),
    });
    prisma.bonusRelease.findMany.mockResolvedValue([
      includedRelease('rel-60', BONUS_60),
      includedRelease('rel-40', BONUS_40),
    ]);
    prisma.expense.findUnique.mockResolvedValue({
      id: 'ex-1',
      name: 'Payroll',
      amount: new Decimal('400000.00'),
      status: 'DUE_NOW',
      dueDate: new Date('2026-04-30'),
      projectId: null,
      productId: null,
      partnerPayoutBatch: null,
      expensePayments: [],
    });
    prisma.expensePayment.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'pay-1',
        amount: data.amount,
        notes: data.notes,
        paymentDate: data.paymentDate,
      }),
    );
  });

  it('records 320000 with explicit 20000 on the 60000 bonus and does not mark it PAID', async () => {
    const paymentId = await createExpensePaymentRecord(prisma as never, 'ex-1', {
      amount: 320000,
      paymentDate: '2026-04-28T00:00:00.000Z',
      bonusAssignments: [{ bonusReleaseId: 'rel-60', amount: '20000.00' }],
      idempotencyKey: 'pay-320',
    });

    expect(paymentId).toBe('pay-1');
    const created = prisma.expensePayment.create.mock.calls[0]?.[0] as {
      data: { notes: string; amount: number };
    };
    expect(created.data.amount).toBe(320000);
    expect(created.data.notes).toContain('20000.00');
    expect(created.data.notes).toContain('rel-60');
    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();
  });

  it('rejects 320000 when bonus cash is not assigned to a named bonus', async () => {
    await expect(
      createExpensePaymentRecord(prisma as never, 'ex-1', {
        amount: 320000,
        paymentDate: '2026-04-28T00:00:00.000Z',
      }),
    ).rejects.toThrow(PAYROLL_CASH_ERRORS.bonusMustAssign);
    expect(prisma.expensePayment.create).not.toHaveBeenCalled();
  });

  it('does not create a second cash row for the same payment key', async () => {
    const notes = encoded320kNotes();
    prisma.expense.findUnique.mockResolvedValue({
      id: 'ex-1',
      name: 'Payroll',
      amount: new Decimal('400000.00'),
      status: 'DUE_NOW',
      dueDate: new Date('2026-04-30'),
      projectId: null,
      productId: null,
      partnerPayoutBatch: null,
      expensePayments: [{ id: 'pay-1', amount: new Decimal('320000.00'), notes }],
    });

    const paymentId = await createExpensePaymentRecord(prisma as never, 'ex-1', {
      amount: 320000,
      paymentDate: '2026-04-28T00:00:00.000Z',
      bonusAssignments: [{ bonusReleaseId: 'rel-60', amount: '20000.00' }],
      idempotencyKey: 'pay-320',
    });

    expect(paymentId).toBe('pay-1');
    expect(prisma.expensePayment.create).not.toHaveBeenCalled();
  });

  it('does not mark unpaid included releases PAID when the 320000 ledger is synced again', async () => {
    const notes = encoded320kNotes();
    prisma.expense.findUnique.mockResolvedValue({
      id: 'ex-1',
      expensePayments: [{ amount: new Decimal('320000.00'), notes }],
    });

    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex-1');
    await syncSalaryLinePaidFromExpenseLedger(prisma as never, 'ex-1');

    expect(prisma.bonusRelease.updateMany).not.toHaveBeenCalled();
    expect(prisma.salaryLine.update).toHaveBeenCalledTimes(2);
    expect(prisma.salaryLine.update.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: new Decimal('320000.00'),
          remainingAmount: new Decimal('80000.00'),
          status: 'PARTIALLY_PAID',
        }),
      }),
    );
  });
});
