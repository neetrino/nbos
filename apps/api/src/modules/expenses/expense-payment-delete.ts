import { NotFoundException } from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { refreshConfirmedPoolPaidForExpense } from '../bonus/product-bonus-pool-paid-cash';
import { PAYROLL_CASH_TRANSACTION_TIMEOUT_MS } from '../payroll-runs/payroll-salary-first-cash-reverse';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { bufferWalletNotifications } from '../employees/wallet-notify-buffer';
import type { OperationalJournalService } from '../finance/journal/operational-journal.service';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import { decodePayrollCashNotes } from '../payroll-runs/payroll-salary-first-cash-notes';
import {
  lockPayrollCashHistoryForUpdate,
  neutralizePayrollCashRefundsForSource,
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
  const buffered = bufferWalletNotifications();
  await prisma.$transaction(
    (tx) =>
      commitExpensePaymentDelete(tx, expenseId, paymentId, {
        journal: opts?.journal,
        notify: opts?.notify == null ? undefined : buffered.sink,
      }),
    { timeout: PAYROLL_CASH_TRANSACTION_TIMEOUT_MS },
  );
  await refreshConfirmedPoolPaidForExpense(prisma, expenseId);
  await buffered.flush(opts?.notify);
}

async function commitExpensePaymentDelete(
  tx: TransactionClient,
  expenseId: string,
  paymentId: string,
  opts?: { notify?: WalletInAppNotifySink; journal?: OperationalJournalService },
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM expenses WHERE id = ${expenseId} FOR UPDATE`;
  const current = await tx.expensePayment.findFirst({
    where: { id: paymentId, expenseId },
  });
  if (!current) {
    throw new NotFoundException(`Expense payment ${paymentId} not found`);
  }
  await lockPayrollCashHistoryForUpdate(tx, expenseId);
  const original = decodePayrollCashNotes(current.notes);
  await tx.expensePayment.delete({ where: { id: paymentId } });
  const refundIds = await neutralizePayrollCashRefundsForSource(tx, expenseId, paymentId);
  await reverseDeletedExpensePaymentJournal(opts?.journal, [paymentId, ...refundIds], tx);
  const db = tx as InstanceType<typeof PrismaClient>;
  await syncExpenseStatusWithPaymentLedger(db, expenseId);
  await syncSalaryLinePaidFromExpenseLedger(db, expenseId, opts?.notify);
  await restoreBonusMarksForDeletedPayrollCash(db, expenseId, original);
}

export function expensePaymentJournalKey(paymentId: string): string {
  return `${EXPENSE_PAYMENT_JOURNAL_KEY_PREFIX}${paymentId}`;
}

async function reverseDeletedExpensePaymentJournal(
  journal: OperationalJournalService | undefined,
  paymentIds: string[],
  tx: TransactionClient,
): Promise<void> {
  if (journal == null) {
    return;
  }
  for (const paymentId of paymentIds) {
    await journal.reverseJournalLineByIdempotencyKey(
      expensePaymentJournalKey(paymentId),
      PAYMENT_DELETED_JOURNAL_NOTE,
      tx,
    );
  }
}
