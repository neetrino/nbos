import type { ExpenseFrequency } from '@nbos/database';

/**
 * Computes the plan's next due date after a generated card's due date (recurring plans only).
 */
export function planNextDueAfterOccurrence(
  occurrenceDue: Date,
  frequency: ExpenseFrequency,
): Date | null {
  const base = new Date(occurrenceDue.getTime());
  switch (frequency) {
    case 'ONE_TIME':
      return null;
    case 'MONTHLY': {
      const d = new Date(base);
      d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    }
    case 'QUARTERLY': {
      const d = new Date(base);
      d.setUTCMonth(d.getUTCMonth() + 3);
      return d;
    }
    case 'YEARLY': {
      const d = new Date(base);
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      return d;
    }
    case 'MULTI_YEAR': {
      const d = new Date(base);
      d.setUTCFullYear(d.getUTCFullYear() + 2);
      return d;
    }
    default:
      return null;
  }
}
