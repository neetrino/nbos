import type { ExpenseStatusEnum, PrismaClient } from '@nbos/database';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';

/**
 * When payments fully cover the expense amount, force workflow to PAID.
 * When no longer fully paid but status was PAID, fall back to UNPAID for corrections.
 */
export function resolveExpenseStatusFromLedger(
  currentStatus: ExpenseStatusEnum,
  isFullyPaid: boolean,
): ExpenseStatusEnum | null {
  if (isFullyPaid && currentStatus !== 'PAID') {
    return 'PAID';
  }
  if (!isFullyPaid && currentStatus === 'PAID') {
    return 'UNPAID';
  }
  return null;
}

export async function syncExpenseStatusWithPaymentLedger(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
): Promise<void> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: true },
  });
  if (!expense) return;

  const paid = sumExpensePaymentAmounts(expense.expensePayments);
  const isFullyPaid = paid.gte(expense.amount);

  const next = resolveExpenseStatusFromLedger(expense.status, isFullyPaid);
  if (next !== null && next !== expense.status) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: next },
    });
  }
}
