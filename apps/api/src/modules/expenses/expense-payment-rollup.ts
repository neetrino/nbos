import { Decimal } from '@nbos/database';

export function sumExpensePaymentAmounts(payments: ReadonlyArray<{ amount: Decimal }>): Decimal {
  return payments.reduce((acc, row) => acc.plus(row.amount), new Decimal(0));
}

export type ExpenseLedgerPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export function computeExpenseLedgerPaymentStatus(
  expenseAmount: Decimal,
  paidTotal: Decimal,
): ExpenseLedgerPaymentStatus {
  if (paidTotal.isZero()) return 'UNPAID';
  if (paidTotal.gte(expenseAmount)) return 'PAID';
  return 'PARTIAL';
}
