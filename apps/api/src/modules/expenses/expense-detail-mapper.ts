import type { Decimal } from '@nbos/database';
import {
  computeExpenseLedgerPaymentStatus,
  sumExpensePaymentAmounts,
  type ExpenseLedgerPaymentStatus,
} from './expense-payment-rollup';

type PaymentRow = {
  id: string;
  amount: Decimal;
  paymentDate: Date;
  notes: string | null;
  createdAt: Date;
};

export type ExpenseLedgerDto = {
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: ExpenseLedgerPaymentStatus;
  payments: Array<{
    id: string;
    amount: string;
    paymentDate: string;
    notes: string | null;
    createdAt: string;
  }>;
};

/**
 * Maps a loaded expense (with payment rows) to API JSON: string amounts + ledger fields.
 */
export function toExpenseLedgerJson<
  T extends { amount: Decimal; expensePayments?: PaymentRow[] | null },
>(expense: T): Omit<T, 'amount' | 'expensePayments'> & { amount: string } & ExpenseLedgerDto {
  const { expensePayments, amount, ...rest } = expense;
  const rows = expensePayments ?? [];
  const paid = sumExpensePaymentAmounts(rows);

  return {
    ...rest,
    amount: amount.toFixed(2),
    paidAmount: paid.toFixed(2),
    remainingAmount: amount.minus(paid).toFixed(2),
    paymentStatus: computeExpenseLedgerPaymentStatus(amount, paid),
    payments: rows.map((p) => ({
      id: p.id,
      amount: p.amount.toFixed(2),
      paymentDate: p.paymentDate.toISOString(),
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
