import type { ApiFieldError } from '@/lib/api-errors';
import type { Expense } from '@/lib/api/finance';
import {
  EXPENSE_GATE_FIELD_PAYMENTS,
  EXPENSE_GATE_FIELD_STATUS,
} from './expense-stage-gate-highlight';

function expenseRemainingAmount(expense: Expense): number {
  if (expense.remainingAmount !== undefined) {
    const remaining = parseFloat(expense.remainingAmount);
    return Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  }
  const amount = parseFloat(expense.amount);
  const paid = expense.paidAmount !== undefined ? parseFloat(expense.paidAmount) : Number.NaN;
  if (!Number.isFinite(amount)) return 0;
  if (!Number.isFinite(paid)) return amount;
  return Math.max(0, amount - paid);
}

/** Local pre-check before kanban status move (payment ledger parity). */
export function getLocalExpenseStatusGateErrors(
  expense: Expense,
  targetStatus: string,
): ApiFieldError[] {
  const errors: ApiFieldError[] = [];
  const remaining = expenseRemainingAmount(expense);

  if (targetStatus === 'PAID' && remaining > 0) {
    errors.push({
      field: EXPENSE_GATE_FIELD_PAYMENTS,
      message: 'Record payments until the expense is fully paid before marking it paid.',
    });
  }

  if (expense.status === 'PAID' && targetStatus !== 'PAID' && targetStatus !== 'CANCELLED') {
    errors.push({
      field: EXPENSE_GATE_FIELD_STATUS,
      message: 'Fully paid expenses stay in Paid until cancelled or adjusted via payments.',
    });
  }

  return errors;
}

export function mapExpenseStatusApiMessage(message: string): ApiFieldError[] {
  if (message.includes('sum of recorded payments')) {
    return [{ field: EXPENSE_GATE_FIELD_PAYMENTS, message }];
  }
  return [];
}
