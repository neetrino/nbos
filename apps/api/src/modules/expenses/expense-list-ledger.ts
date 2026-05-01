import { Decimal, PrismaClient } from '@nbos/database';
import {
  computeExpenseLedgerPaymentStatus,
  type ExpenseLedgerPaymentStatus,
} from './expense-payment-rollup';

export async function fetchExpensePaidTotalsByExpenseIds(
  prisma: InstanceType<typeof PrismaClient>,
  expenseIds: string[],
): Promise<Map<string, Decimal>> {
  if (expenseIds.length === 0) return new Map();

  const rows = await prisma.expensePayment.groupBy({
    by: ['expenseId'],
    where: { expenseId: { in: expenseIds } },
    _sum: { amount: true },
  });

  const map = new Map<string, Decimal>();
  for (const row of rows) {
    map.set(row.expenseId, row._sum.amount ?? new Decimal(0));
  }
  return map;
}

export function attachLedgerFieldsToExpenseListItems<T extends { id: string; amount: Decimal }>(
  items: T[],
  paidTotals: Map<string, Decimal>,
): Array<
  T & {
    paidAmount: string;
    remainingAmount: string;
    paymentStatus: ExpenseLedgerPaymentStatus;
  }
> {
  return items.map((item) => {
    const paid = paidTotals.get(item.id) ?? new Decimal(0);
    return {
      ...item,
      paidAmount: paid.toFixed(2),
      remainingAmount: item.amount.minus(paid).toFixed(2),
      paymentStatus: computeExpenseLedgerPaymentStatus(item.amount, paid),
    };
  });
}
