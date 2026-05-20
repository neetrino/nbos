import type { ExpenseStatusEnum, PrismaClient } from '@nbos/database';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';
import { refreshExpenseWorkflowStatus } from './expense-workflow';

/**
 * When payments fully cover the expense amount, force workflow to PAID.
 * When no longer fully paid but status was PAID, re-derive board workflow from due date.
 */
export function resolveExpenseStatusFromLedger(
  currentStatus: ExpenseStatusEnum,
  isFullyPaid: boolean,
  dueDate: Date | null,
): ExpenseStatusEnum | null {
  if (isFullyPaid && currentStatus !== 'PAID') {
    return 'PAID';
  }
  if (!isFullyPaid && currentStatus === 'PAID') {
    return refreshExpenseWorkflowStatus('PLANNED', dueDate);
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

  const next = resolveExpenseStatusFromLedger(expense.status, isFullyPaid, expense.dueDate);
  if (next !== null && next !== expense.status) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { status: next },
    });
  }
}
