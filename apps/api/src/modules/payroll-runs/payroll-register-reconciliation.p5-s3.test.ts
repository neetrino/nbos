import { Decimal } from '@nbos/database';
import { beforeEach, describe, expect, it } from 'vitest';

import { loadWalletBonusLedgerContext } from '../employees/employee-wallet-ledger-context';
import { createExpensePaymentRecord } from '../expenses/expense-payment-create';
import { deleteExpensePaymentRecord } from '../expenses/expense-payment-delete';
import { refundExpensePayrollCash } from '../expenses/expense-payment-refund';
import { sumExpensePaymentAmounts } from '../expenses/expense-payment-rollup';
import { PAYROLL_CASH_REVERSE_ERRORS } from './payroll-salary-first-cash-reverse';
import { moneyAmount } from './payroll-allocation-source-amounts';
import { activeCashJournalNet } from './payroll-register-reconciliation.p5-s3.journal';
import { fullyPaidAttributedReleaseIds } from './payroll-salary-first-cash-apply';
import { sumNetEncodedBonusCashByRelease } from './payroll-salary-first-cash-reverse';
import { payrollCashLedgerPaidAmount } from './payroll-salary-first-cash-reverse-paid';
import {
  P5_S3_BONUS,
  P5_S3_BONUS_CASH,
  P5_S3_BONUS_UNPAID,
  P5_S3_EMPLOYEE_ID,
  P5_S3_ENTRY_ID,
  P5_S3_EXPENSE,
  P5_S3_EXPENSE_ID,
  P5_S3_LINE_REMAINING,
  P5_S3_PAYMENT,
  P5_S3_RELEASE_ID,
  P5_S3_SALARY,
} from './payroll-register-reconciliation.p5-s3.amounts';
import {
  createP5S3RegisterFixture,
  type P5S3RegisterFixture,
} from './payroll-register-reconciliation.p5-s3.fixture';

const PAY_DATE = '2026-04-28T00:00:00.000Z';
const REST_DATE = '2026-04-29T00:00:00.000Z';
const REFUND_DATE = '2026-05-02T00:00:00.000Z';
const COUNTING = new Set(['APPROVED', 'INCLUDED_IN_PAYROLL', 'PAID']);

describe('P5-S3 register reconciliation', () => {
  let fixture: P5S3RegisterFixture;

  beforeEach(() => {
    fixture = createP5S3RegisterFixture();
  });

  it('agrees after 320000 cash: salary, run, expense, release, wallet, pool, journal', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);

    const attributed = sumNetEncodedBonusCashByRelease(fixture.payments);
    const wallet = await loadWalletForEntry(fixture);
    const released = countingReleased(fixture);

    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
    expect(fixture.salaryLine.remainingAmount.toFixed(2)).toBe(P5_S3_LINE_REMAINING.toFixed(2));
    const runUpdate = fixture.prisma.payrollRun.update.mock.calls[0]?.[0] as {
      data: { totalPaid: Decimal };
    };
    expect(runUpdate.data.totalPaid.toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
    expect(payrollCashLedgerPaidAmount(fixture.payments).toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
    expect(sumExpensePaymentAmounts(fixture.payments).toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
    expect(sumExpensePaymentAmounts(fixture.payments).gte(P5_S3_EXPENSE)).toBe(false);
    expect(fixture.releases[0]?.status).toBe('INCLUDED_IN_PAYROLL');
    expect(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2)).toBe(P5_S3_BONUS_CASH.toFixed(2));
    expect(wallet?.paidAmount.toFixed(2)).toBe(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2));
    expect(wallet?.remainingAmount.toFixed(2)).toBe(P5_S3_BONUS_UNPAID.toFixed(2));
    expect(wallet?.paidAmount.toFixed(2)).not.toBe('0.00');
    expect(wallet?.paidAmount.toFixed(2)).not.toBe(P5_S3_BONUS.toFixed(2));
    expect(released.toFixed(2)).toBe(P5_S3_BONUS.toFixed(2));
    expect(P5_S3_BONUS.minus(released).toFixed(2)).toBe('0.00');
    expect(fixture.prisma.bonusRelease.create).not.toHaveBeenCalled();
    expect(fixture.prisma.productBonusPool.upsert).not.toHaveBeenCalled();
    expect(lastJournalAmount(fixture)).toBe(P5_S3_PAYMENT.toNumber());
    expect(fullyPaidAttributedReleaseIds(fixture.releases, fixture.payments)).toEqual([]);
  });

  it('marks the release PAID and wallet 60000 after the remaining 40000', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    fixture.prisma.bonusRelease.updateMany.mockClear();
    await payNamedBonus(fixture, P5_S3_BONUS_UNPAID, P5_S3_BONUS_UNPAID, REST_DATE);

    const attributed = sumNetEncodedBonusCashByRelease(fixture.payments);
    const wallet = await loadWalletForEntry(fixture);
    const paidTotal = moneyAmount(P5_S3_PAYMENT.plus(P5_S3_BONUS_UNPAID));

    expect(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2)).toBe(P5_S3_BONUS.toFixed(2));
    expect(fixture.releases[0]?.status).toBe('PAID');
    expect(wallet?.paidAmount.toFixed(2)).toBe(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2));
    expect(wallet?.remainingAmount.toFixed(2)).toBe('0.00');
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe(paidTotal.toFixed(2));
    expect(sumExpensePaymentAmounts(fixture.payments).toFixed(2)).toBe(paidTotal.toFixed(2));
    expect(countingReleased(fixture).toFixed(2)).toBe(P5_S3_BONUS.toFixed(2));
    expect(fixture.prisma.bonusRelease.create).not.toHaveBeenCalled();
    expect(fixture.prisma.bonusRelease.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [P5_S3_RELEASE_ID] } },
        data: { status: 'PAID' },
      }),
    );
  });

  it('refunds the 20000 bonus part to wallet 0 and salary paidAmount 300000', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    await refundExpensePayrollCash(
      fixture.prisma as never,
      P5_S3_EXPENSE_ID,
      'pay-1',
      {
        amount: P5_S3_BONUS_CASH.toNumber(),
        paymentDate: REFUND_DATE,
        reason: 'Client return of bonus cash',
      },
      { journal: fixture.journal as never },
    );

    const attributed = sumNetEncodedBonusCashByRelease(fixture.payments);
    const wallet = await loadWalletForEntry(fixture);
    const journalCalls = fixture.journal.appendExpensePaymentLine.mock.calls;

    expect(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2) ?? '0.00').toBe('0.00');
    expect(wallet?.paidAmount.toFixed(2)).toBe('0.00');
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe(P5_S3_SALARY.toFixed(2));
    expect(payrollCashLedgerPaidAmount(fixture.payments).toFixed(2)).toBe(P5_S3_SALARY.toFixed(2));
    expect(fixture.releases[0]?.status).toBe('INCLUDED_IN_PAYROLL');
    expect(journalCalls[0]?.[0]?.amount).toBe(P5_S3_PAYMENT.toNumber());
    expect(journalCalls[1]?.[0]?.amount).toBe(P5_S3_BONUS_CASH.negated().toNumber());
  });

  it('does not pay the 20000 bonus twice after the refund', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    await refundExpensePayrollCash(fixture.prisma as never, P5_S3_EXPENSE_ID, 'pay-1', {
      amount: P5_S3_BONUS_CASH.toNumber(),
      paymentDate: REFUND_DATE,
      reason: 'Client return of bonus cash',
    });
    await payNamedBonus(fixture, P5_S3_BONUS_CASH, P5_S3_BONUS_CASH, REST_DATE);

    const attributed = sumNetEncodedBonusCashByRelease(fixture.payments);
    const wallet = await loadWalletForEntry(fixture);
    expect(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2)).toBe(P5_S3_BONUS_CASH.toFixed(2));
    expect(wallet?.paidAmount.toFixed(2)).toBe(attributed.get(P5_S3_RELEASE_ID)?.toFixed(2));
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
  });

  it('deletes the 320000 payment and nets ACTIVE journal cash to 0', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    await deleteExpensePaymentRecord(fixture.prisma as never, P5_S3_EXPENSE_ID, 'pay-1', {
      journal: fixture.journal as never,
    });

    const wallet = await loadWalletForEntry(fixture);
    expect(sumExpensePaymentAmounts(fixture.payments).toFixed(2)).toBe('0.00');
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe('0.00');
    expect(wallet?.paidAmount.toFixed(2)).toBe('0.00');
    expect(activeCashJournalNet(fixture.journal.lines).toFixed(2)).toBe('0.00');
    expect(fixture.journal.reverseJournalLineByIdempotencyKey).toHaveBeenCalledWith(
      'expense-payment:pay-1',
      expect.any(String),
      fixture.prisma,
    );
  });

  it('refunds 20000 then deletes the source and nets ACTIVE journal cash to 0', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    await refundExpensePayrollCash(
      fixture.prisma as never,
      P5_S3_EXPENSE_ID,
      'pay-1',
      {
        amount: P5_S3_BONUS_CASH.toNumber(),
        paymentDate: REFUND_DATE,
        reason: 'Client return of bonus cash',
      },
      { journal: fixture.journal as never },
    );
    await deleteExpensePaymentRecord(fixture.prisma as never, P5_S3_EXPENSE_ID, 'pay-1', {
      journal: fixture.journal as never,
    });

    const wallet = await loadWalletForEntry(fixture);
    const leftover = fixture.payments.find((row) => row.id !== 'pay-1');
    expect(leftover?.amount.toFixed(2)).toBe('0.00');
    expect(sumExpensePaymentAmounts(fixture.payments).toFixed(2)).toBe('0.00');
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe('0.00');
    expect(wallet?.paidAmount.toFixed(2)).toBe('0.00');
    expect(activeCashJournalNet(fixture.journal.lines).toFixed(2)).toBe('0.00');
    expect(fixture.journal.reverseJournalLineByIdempotencyKey).toHaveBeenCalledWith(
      'expense-payment:pay-1',
      expect.any(String),
      fixture.prisma,
    );
    expect(fixture.journal.reverseJournalLineByIdempotencyKey).toHaveBeenCalledWith(
      'expense-payment:pay-2',
      expect.any(String),
      fixture.prisma,
    );
  });

  it('rejects a closed-run delete before any write, including the journal', async () => {
    await payNamedBonus(fixture, P5_S3_PAYMENT, P5_S3_BONUS_CASH, PAY_DATE);
    fixture.salaryLine.payrollRun.status = 'CLOSED';
    fixture.journal.reverseJournalLineByIdempotencyKey.mockClear();
    fixture.prisma.expensePayment.delete.mockClear();

    await expect(
      deleteExpensePaymentRecord(fixture.prisma as never, P5_S3_EXPENSE_ID, 'pay-1', {
        journal: fixture.journal as never,
      }),
    ).rejects.toThrow(PAYROLL_CASH_REVERSE_ERRORS.closedHistory);

    expect(fixture.prisma.expensePayment.delete).not.toHaveBeenCalled();
    expect(fixture.journal.reverseJournalLineByIdempotencyKey).not.toHaveBeenCalled();
    expect(activeCashJournalNet(fixture.journal.lines).toFixed(2)).toBe(
      P5_S3_PAYMENT.negated().toFixed(2),
    );
    expect(sumExpensePaymentAmounts(fixture.payments).toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
    expect(fixture.salaryLine.paidAmount.toFixed(2)).toBe(P5_S3_PAYMENT.toFixed(2));
  });
});

async function payNamedBonus(
  fixture: P5S3RegisterFixture,
  cash: Decimal,
  bonusAssignment: Decimal,
  paymentDate: string,
): Promise<void> {
  await createExpensePaymentRecord(
    fixture.prisma as never,
    P5_S3_EXPENSE_ID,
    {
      amount: cash.toNumber(),
      paymentDate,
      bonusAssignments: [{ bonusReleaseId: P5_S3_RELEASE_ID, amount: bonusAssignment.toFixed(2) }],
    },
    { journal: fixture.journal as never },
  );
}

async function loadWalletForEntry(fixture: P5S3RegisterFixture) {
  const ctx = await loadWalletBonusLedgerContext(
    fixture.prisma as never,
    [{ id: P5_S3_ENTRY_ID, orderId: 'ord-1', amount: P5_S3_BONUS }],
    P5_S3_EMPLOYEE_ID,
  );
  return ctx.rollups.get(P5_S3_ENTRY_ID);
}

function countingReleased(fixture: P5S3RegisterFixture): Decimal {
  return fixture.releases.reduce(
    (sum, row) => {
      if (!COUNTING.has(row.status)) {
        return sum;
      }
      return moneyAmount(sum.plus(row.amount));
    },
    moneyAmount(new Decimal(0)),
  );
}

function lastJournalAmount(fixture: P5S3RegisterFixture): number | undefined {
  const calls = fixture.journal.appendExpensePaymentLine.mock.calls;
  const last = calls[calls.length - 1]?.[0] as { amount?: number } | undefined;
  return last?.amount;
}
