import type { ApiFieldError } from '@/lib/api-errors';
import type { Expense } from '@/lib/api/finance';
import {
  EXPENSE_GATE_FIELD_PAYMENTS,
  EXPENSE_GATE_FIELD_STATUS,
} from './expense-stage-gate-highlight';

/** Local pre-check before kanban status move. Mark Paid settles remaining on the API. */
export function getLocalExpenseStatusGateErrors(
  expense: Expense,
  targetStatus: string,
): ApiFieldError[] {
  const errors: ApiFieldError[] = [];
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
