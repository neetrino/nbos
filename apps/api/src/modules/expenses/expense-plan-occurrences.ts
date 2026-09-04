import type { ExpenseFrequency } from '@nbos/database';
import { planNextDueAfterOccurrence } from './expense-plan-next-due';

/** Headroom for WEEKLY (~52/year); MONTHLY/YEARLY need far fewer steps. */
const MAX_OCCURRENCE_STEPS = 1040;

/**
 * UTC month indexes (0–11) in `year` from `nextDueDate` forward.
 * Does not invent months before the next due — past cells appear only when a card exists.
 */
export function collectPlanMonthIndexesInYear(
  year: number,
  frequency: ExpenseFrequency,
  anchorDue: Date | null,
): Set<number> {
  if (!anchorDue) {
    return new Set();
  }
  if (frequency === 'ONE_TIME') {
    return anchorDue.getUTCFullYear() === year ? new Set([anchorDue.getUTCMonth()]) : new Set();
  }

  const indexes = new Set<number>();
  let cursor = new Date(anchorDue.getTime());
  if (cursor.getUTCFullYear() > year) {
    return indexes;
  }

  for (let i = 0; i < MAX_OCCURRENCE_STEPS; i++) {
    if (cursor.getUTCFullYear() > year) {
      break;
    }
    if (cursor.getUTCFullYear() === year) {
      indexes.add(cursor.getUTCMonth());
    }
    const next = planNextDueAfterOccurrence(cursor, frequency);
    if (!next) {
      break;
    }
    cursor = next;
  }

  return indexes;
}

export function utcMonthIndexFromDate(date: Date): number {
  return date.getUTCMonth();
}
