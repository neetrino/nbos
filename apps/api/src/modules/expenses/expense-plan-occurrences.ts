import type { ExpenseFrequency } from '@nbos/database';
import { planNextDueAfterOccurrence } from './expense-plan-next-due';

const MAX_OCCURRENCE_STEPS = 240;

/** Previous occurrence before `due` for recurring frequencies; `ONE_TIME` has no prior step. */
export function planOccurrenceBefore(due: Date, frequency: ExpenseFrequency): Date | null {
  const base = new Date(due.getTime());
  switch (frequency) {
    case 'ONE_TIME':
      return null;
    case 'MONTHLY': {
      const d = new Date(base);
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d;
    }
    case 'QUARTERLY': {
      const d = new Date(base);
      d.setUTCMonth(d.getUTCMonth() - 3);
      return d;
    }
    case 'YEARLY': {
      const d = new Date(base);
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      return d;
    }
    case 'MULTI_YEAR': {
      const d = new Date(base);
      d.setUTCFullYear(d.getUTCFullYear() - 2);
      return d;
    }
    default:
      return null;
  }
}

/** UTC month indexes (0–11) in `year` when the plan is due, from `nextDueDate` and `frequency`. */
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

  for (let i = 0; i < MAX_OCCURRENCE_STEPS; i++) {
    if (cursor.getUTCFullYear() < year) {
      break;
    }
    const prev = planOccurrenceBefore(cursor, frequency);
    if (!prev || prev.getTime() >= cursor.getTime()) {
      break;
    }
    cursor = prev;
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
