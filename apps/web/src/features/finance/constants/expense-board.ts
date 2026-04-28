import type { Expense } from '../../../lib/api/finance';

/** Days until due (inclusive) to classify as "Due Soon" on the Expense Board (NBOS UI spec). */
export const EXPENSE_BOARD_DUE_SOON_DAYS = 7;

export const EXPENSE_BOARD_COLUMN_KEYS = [
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
] as const;

export type ExpenseBoardColumnKey = (typeof EXPENSE_BOARD_COLUMN_KEYS)[number];

export const EXPENSE_BOARD_COLUMNS: ReadonlyArray<{
  key: ExpenseBoardColumnKey;
  label: string;
}> = [
  { key: 'PLANNED', label: 'Planned' },
  { key: 'DUE_SOON', label: 'Due Soon' },
  { key: 'DUE_NOW', label: 'Due Now' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'ON_HOLD', label: 'On Hold' },
];

/** UTC calendar day `YYYY-MM-DD` from an ISO datetime, or null if missing/invalid. */
export function utcCalendarDayFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addUtcDays(calendarDay: string, days: number): string {
  const [ys, ms, ds] = calendarDay.split('-');
  const base = Date.UTC(Number(ys), Number(ms) - 1, Number(ds));
  const next = new Date(base + days * 86_400_000);
  return utcCalendarDayFromIso(next.toISOString()) ?? calendarDay;
}

/**
 * Maps an expense to an NBOS Expense Board column (`docs/NBOS/02-Modules/04-Finance/04-Expenses.md`).
 * `PAID` / `DELAYED` are not board lanes (Closed / Backlog); return null so UI can skip them.
 */
export function resolveExpenseBoardColumn(
  expense: Pick<Expense, 'status' | 'dueDate'>,
  options?: { referenceDayUtc?: string },
): ExpenseBoardColumnKey | null {
  const status = expense.status;
  if (status === 'PAID' || status === 'DELAYED') {
    return null;
  }

  const refDay = options?.referenceDayUtc ?? utcCalendarDayFromIso(new Date().toISOString());
  if (!refDay) {
    return null;
  }

  const dueDay = utcCalendarDayFromIso(expense.dueDate);

  if (status === 'ON_HOLD') {
    return 'ON_HOLD';
  }
  if (status === 'PAY_NOW') {
    return 'DUE_NOW';
  }

  if (status === 'UNPAID') {
    if (dueDay !== null && dueDay < refDay) {
      return 'OVERDUE';
    }
    return 'DUE_NOW';
  }

  if (status === 'THIS_MONTH') {
    if (dueDay !== null && dueDay < refDay) {
      return 'OVERDUE';
    }
    const soonEnd = addUtcDays(refDay, EXPENSE_BOARD_DUE_SOON_DAYS);
    if (dueDay !== null && dueDay >= refDay && dueDay <= soonEnd) {
      return 'DUE_SOON';
    }
    return 'PLANNED';
  }

  return null;
}
