import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import type { OperationalJournalService } from '../finance/journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import { decodePayrollCashNotes } from '../payroll-runs/payroll-salary-first-cash-notes';
import {
  neutralizePayrollCashRefundsForSource,
  rejectClosedPayrollCashHistory,
  restoreBonusMarksForDeletedPayrollCash,
} from '../payroll-runs/payroll-salary-first-cash-reverse-apply';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { syncExpenseStatusWithPaymentLedger } from './expense-status-ledger-sync';

export const EXPENSE_PAYMENT_JOURNAL_KEY_PREFIX = 'expense-payment:';

const PAYMENT_DELETED_JOURNAL_NOTE = 'Payroll expense payment deleted';

/**
 * Deletes an expense payment and restores its original payroll salary and bonus links.
 * Does not rewrite the payment split. Closed payroll history is not edited in place.
 */
export async function deleteExpensePaymentRecord(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  paymentId: string,
  opts?: { notify?: WalletInAppNotifySink; journal?: OperationalJournalService },
): Promise<void> {
  const row = await prisma.expensePayment.findFirst({
    where: { id: paymentId, expenseId },
  });
  if (!row) {
    throw new NotFoundException(`Expense payment ${paymentId} not found`);
  }
  await assertPostingPeriodOpenForBookedAt(prisma, row.paymentDate);
  await rejectClosedPayrollCashHistory(prisma, expenseId);
  const original = decodePayrollCashNotes(row.notes);
  await prisma.expensePayment.delete({ where: { id: paymentId } });
  const refundIds = await neutralizePayrollCashRefundsForSource(prisma, expenseId, paymentId);
  await reverseDeletedExpensePaymentJournal(opts?.journal, [paymentId, ...refundIds]);
  await syncExpenseStatusWithPaymentLedger(prisma, expenseId);
  await syncSalaryLinePaidFromExpenseLedger(prisma, expenseId, opts?.notify);
  await restoreBonusMarksForDeletedPayrollCash(prisma, expenseId, original);
}

export function expensePaymentJournalKey(paymentId: string): string {
  return `${EXPENSE_PAYMENT_JOURNAL_KEY_PREFIX}${paymentId}`;
}

async function reverseDeletedExpensePaymentJournal(
  journal: OperationalJournalService | undefined,
  paymentIds: string[],
): Promise<void> {
  if (journal == null) {
    return;
  }
  for (const paymentId of paymentIds) {
    await journal.reverseJournalLineByIdempotencyKey(
      expensePaymentJournalKey(paymentId),
      PAYMENT_DELETED_JOURNAL_NOTE,
    );
  }
}
