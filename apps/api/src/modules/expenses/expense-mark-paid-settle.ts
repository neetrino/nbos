import { NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { createExpensePaymentRecord } from './expense-payment-create';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';
import type { OperationalJournalService } from '../finance/journal/operational-journal.service';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';

/** Audit note for payments created by Mark Paid (not Add Payment form). */
export const MARK_PAID_AUTO_EXPENSE_PAYMENT_NOTE = 'Auto-created when expense marked as paid';

/** Calendar date (YYYY-MM-DD) for ExpensePayment.paymentDate from a clock instant. */
export function markPaidExpensePaymentDateIso(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function expenseMarkPaidOutstanding(
  amount: Decimal,
  payments: ReadonlyArray<{ amount: Decimal }>,
): Decimal {
  const remaining = amount.minus(sumExpensePaymentAmounts(payments));
  return remaining.gt(0) ? remaining : new Decimal(0);
}

/**
 * When Mark Paid is requested and the ledger still has a remainder, write that
 * remainder as an Expense Payment (same path as Add Payment).
 */
export async function settleExpenseMarkPaidIfOutstanding(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  opts?: {
    notify?: WalletInAppNotifySink;
    journal?: OperationalJournalService;
    now?: Date;
  },
): Promise<boolean> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: true },
  });
  if (!expense) {
    throw new NotFoundException(`Expense ${expenseId} not found`);
  }

  const outstanding = expenseMarkPaidOutstanding(expense.amount, expense.expensePayments);
  if (outstanding.lte(0)) {
    return false;
  }

  await createExpensePaymentRecord(
    prisma,
    expenseId,
    {
      amount: outstanding.toNumber(),
      paymentDate: markPaidExpensePaymentDateIso(opts?.now ?? new Date()),
      notes: MARK_PAID_AUTO_EXPENSE_PAYMENT_NOTE,
    },
    { notify: opts?.notify, journal: opts?.journal },
  );
  return true;
}
