import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { settleExpenseMarkPaidIfOutstanding } from '../expenses/expense-mark-paid-settle';
import { decodePayrollCashNotes, encodePayrollCashNotes } from './payroll-salary-first-cash-notes';
import { preparePayrollCashPayment } from './payroll-salary-first-cash-apply';
import {
  allocateSalaryFirstCash,
  parsePayrollCashBonusAssignments,
  PAYROLL_CASH_ERRORS,
  PAYROLL_CASH_NOTES_PREFIX,
} from './payroll-salary-first-cash';

const SALARY = new Decimal('300000.00');
const BONUS_100 = new Decimal('100000.00');
const CARRY = new Decimal('30000.00');
const CASH_430 = new Decimal('430000.00');

function thisRunBonus() {
  return {
    id: 'rel-100',
    amount: BONUS_100,
    payrollIncludedAmount: BONUS_100,
    status: 'INCLUDED_IN_PAYROLL',
  };
}

function priorMonthRelease() {
  return {
    id: 'rel-prior',
    amount: CARRY,
    payrollIncludedAmount: CARRY,
    status: 'PAID',
  };
}

function allocate430k() {
  return allocateSalaryFirstCash({
    cash: CASH_430,
    salaryRemaining: SALARY,
    bonuses: [{ bonusReleaseId: 'rel-100', remaining: BONUS_100 }],
    assignments: parsePayrollCashBonusAssignments([
      { bonusReleaseId: 'rel-100', amount: '100000.00' },
    ]),
    carryRemaining: CARRY,
  });
}

describe('P5-S1 salary-line carry cash', () => {
  it('records carry on the server encoding, not on the this-run bonus', () => {
    const prepared = preparePayrollCashPayment({
      cash: CASH_430,
      alreadyPaidCash: new Decimal(0),
      baseSalary: SALARY,
      carryAppliedAmount: CARRY,
      releases: [thisRunBonus()],
      existingPayments: [],
      assignments: [{ bonusReleaseId: 'rel-100', amount: '100000.00' }],
    });
    const decoded = decodePayrollCashNotes(prepared.notes);

    expect(prepared.allocation.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(prepared.allocation.bonusCash.toFixed(2)).toBe('100000.00');
    expect(prepared.allocation.carryAmount.toFixed(2)).toBe('30000.00');
    expect(decoded?.carryAmount.toFixed(2)).toBe('30000.00');
    expect(decoded?.bonusParts[0]?.bonusReleaseId).toBe('rel-100');
    expect(decoded?.bonusParts[0]?.amount.toFixed(2)).toBe('100000.00');
    expect(prepared.notes.startsWith(PAYROLL_CASH_NOTES_PREFIX)).toBe(true);
  });

  it('does not let a caller note retarget the encoded split', () => {
    const notes = encodePayrollCashNotes(allocate430k(), {
      userNotes: `${PAYROLL_CASH_NOTES_PREFIX}{"salaryAmount":"0.00","bonusParts":[],"carryAmount":"0.00"}`,
    });
    const decoded = decodePayrollCashNotes(notes);
    expect(decoded?.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(decoded?.carryAmount.toFixed(2)).toBe('30000.00');
    expect(decoded?.bonusParts[0]?.amount.toFixed(2)).toBe('100000.00');
  });

  it('rejects a second carry payment above the line carry', () => {
    const existing = encodePayrollCashNotes(allocate430k());
    expect(() =>
      preparePayrollCashPayment({
        cash: new Decimal('10000.00'),
        alreadyPaidCash: CASH_430,
        baseSalary: SALARY,
        carryAppliedAmount: CARRY,
        releases: [thisRunBonus()],
        existingPayments: [{ id: 'pay-1', amount: CASH_430, notes: existing }],
        assignments: [],
      }),
    ).toThrow(PAYROLL_CASH_ERRORS.bonusMustAssign);
  });
});

describe('P5-S1 430000 expense with included bonus and carry', () => {
  let prisma: MockPrisma;
  let expensePayments: { id: string; amount: Decimal; notes: string | null }[];

  beforeEach(() => {
    prisma = createMockPrisma();
    expensePayments = [];
    prisma.financePostingPeriod.findUnique.mockResolvedValue(null);
    prisma.salaryLine.findUnique.mockResolvedValue({
      id: 'sl-1',
      payrollRunId: 'pr-may',
      employeeId: 'emp-1',
      baseSalary: SALARY,
      totalPayable: CASH_430,
      payrollCarryAppliedAmount: CARRY,
    });
    prisma.bonusRelease.findMany.mockImplementation(
      async ({ where }: { where?: { id?: { in?: string[] }; status?: string } }) => {
        const rows = [thisRunBonus(), priorMonthRelease()];
        return rows
          .filter((row) => {
            if (where?.status === 'INCLUDED_IN_PAYROLL' && row.status !== 'INCLUDED_IN_PAYROLL') {
              return false;
            }
            if (where?.id?.in != null && !where.id.in.includes(row.id)) {
              return false;
            }
            return true;
          })
          .map((row) => ({
            ...row,
            bonusEntryId: row.id === 'rel-100' ? 'be-1' : 'be-prior',
            bonusEntry: { order: { code: 'O-1' } },
          }));
      },
    );
    prisma.expense.findUnique.mockImplementation(async () => ({
      id: 'ex-1',
      name: 'Payroll',
      amount: CASH_430,
      status: 'DUE_NOW',
      dueDate: new Date('2026-05-31'),
      projectId: null,
      productId: null,
      partnerPayoutBatch: null,
      expensePayments,
    }));
    prisma.expensePayment.create.mockImplementation(
      async ({ data }: { data: { amount: number; notes: string | null } }) => {
        const row = {
          id: 'pay-430',
          amount: new Decimal(data.amount),
          notes: data.notes,
        };
        expensePayments.push(row);
        return row;
      },
    );
    prisma.payrollRun.findUnique.mockResolvedValue({ payrollMonth: '2026-05' });
    prisma.bonusEntry.findUnique.mockResolvedValue({
      id: 'be-1',
      status: 'ACTIVE',
      amount: BONUS_100,
      employeeId: 'emp-1',
      orderId: 'o1',
      order: { code: 'O-1' },
    });
    prisma.bonusRelease.aggregate.mockResolvedValue({ _sum: { amount: BONUS_100 } });
    prisma.order.findUnique.mockResolvedValue(null);
  });

  it('records a manual 430000 payment and can mark the line paid', async () => {
    const paymentId = await createExpensePaymentRecord(prisma as never, 'ex-1', {
      amount: 430000,
      paymentDate: '2026-05-28T00:00:00.000Z',
      bonusAssignments: [{ bonusReleaseId: 'rel-100', amount: '100000.00' }],
    });
    const created = prisma.expensePayment.create.mock.calls[0]?.[0] as {
      data: { notes: string; amount: number };
    };
    const decoded = decodePayrollCashNotes(created.data.notes);

    expect(paymentId).toBe('pay-430');
    expect(created.data.amount).toBe(430000);
    expect(decoded?.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(decoded?.carryAmount.toFixed(2)).toBe('30000.00');
    expect(decoded?.bonusParts[0]?.amount.toFixed(2)).toBe('100000.00');
    expect(prisma.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: CASH_430,
          remainingAmount: new Decimal(0),
          status: 'PAID',
        }),
      }),
    );
    expect(prisma.bonusRelease.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['rel-100'] } },
      data: { status: 'PAID' },
    });
    expect(prisma.bonusRelease.update).not.toHaveBeenCalled();
    expect(prisma.payrollRun.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pr-prior' } }),
    );
  });

  it('lets Mark Paid settle the same 430000 expense', async () => {
    const settled = await settleExpenseMarkPaidIfOutstanding(prisma as never, 'ex-1', {
      now: new Date('2026-05-28T10:00:00.000Z'),
    });
    const created = prisma.expensePayment.create.mock.calls[0]?.[0] as {
      data: { notes: string; amount: number };
    };
    const decoded = decodePayrollCashNotes(created.data.notes);

    expect(settled).toBe(true);
    expect(created.data.amount).toBe(430000);
    expect(decoded?.salaryAmount.toFixed(2)).toBe('300000.00');
    expect(decoded?.bonusParts[0]?.amount.toFixed(2)).toBe('100000.00');
    expect(decoded?.carryAmount.toFixed(2)).toBe('30000.00');
    expect(prisma.salaryLine.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', paidAmount: CASH_430 }),
      }),
    );
  });

  it('rejects assigning 130000 to the 100000 this-run bonus', async () => {
    await expect(
      createExpensePaymentRecord(prisma as never, 'ex-1', {
        amount: 430000,
        paymentDate: '2026-05-28T00:00:00.000Z',
        bonusAssignments: [{ bonusReleaseId: 'rel-100', amount: '130000.00' }],
      }),
    ).rejects.toThrow(PAYROLL_CASH_ERRORS.exceedsApproved);
    expect(prisma.expensePayment.create).not.toHaveBeenCalled();
  });
});
