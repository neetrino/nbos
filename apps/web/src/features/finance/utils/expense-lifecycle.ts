import type { Expense } from '@/lib/api/finance';

export function canHardDeleteExpense(expense: Expense): boolean {
  const paymentCount = expense.payments?.length ?? 0;
  return expense.status === 'PLANNED' && paymentCount === 0 && !expense.linkedPayrollRun;
}

export function canCancelExpense(expense: Expense): boolean {
  return expense.status !== 'PAID' && expense.status !== 'CANCELLED';
}

export function expenseLifecycleAction(expense: Expense): 'delete' | 'cancel' | null {
  if (canHardDeleteExpense(expense)) return 'delete';
  if (canCancelExpense(expense)) return 'cancel';
  return null;
}
