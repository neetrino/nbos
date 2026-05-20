import type { ExpenseStatusEnum } from '@nbos/database';

/** Expense Board lanes (NBOS `04-Expenses.md`). */
export const EXPENSE_BOARD_COLUMN_STATUSES = [
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
  'ON_HOLD',
] as const satisfies readonly ExpenseStatusEnum[];

export type ExpenseBoardColumnStatus = (typeof EXPENSE_BOARD_COLUMN_STATUSES)[number];

/** Off the active board (Closed / Backlog routes). */
export const EXPENSE_OFF_BOARD_STATUSES = [
  'PAID',
  'BACKLOG',
  'CANCELLED',
] as const satisfies readonly ExpenseStatusEnum[];

export const EXPENSE_BOARD_SCOPE_EXCLUDE: ExpenseStatusEnum[] = ['PAID', 'BACKLOG'];

export const EXPENSE_DUE_SOON_DAYS = 7;

const TIME_BASED_STATUSES = new Set<ExpenseStatusEnum>([
  'PLANNED',
  'DUE_SOON',
  'DUE_NOW',
  'OVERDUE',
]);

const STORED_MANUAL_STATUSES = new Set<ExpenseStatusEnum>([
  'ON_HOLD',
  'BACKLOG',
  'DUE_NOW',
  'PAID',
  'CANCELLED',
]);

export function utcCalendarDayFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addUtcCalendarDays(calendarDay: string, days: number): string {
  const [ys, ms, ds] = calendarDay.split('-');
  const base = Date.UTC(Number(ys), Number(ms) - 1, Number(ds));
  const next = new Date(base + days * 86_400_000);
  return utcCalendarDayFromDate(next);
}

export function deriveTimeBasedWorkflowStatus(
  dueDate: Date | null | undefined,
  referenceDay: string = utcCalendarDayFromDate(new Date()),
): ExpenseBoardColumnStatus {
  const dueDay = dueDate ? utcCalendarDayFromDate(dueDate) : null;
  if (dueDay !== null && dueDay < referenceDay) {
    return 'OVERDUE';
  }
  if (dueDay !== null && dueDay === referenceDay) {
    return 'DUE_NOW';
  }
  const soonEnd = addUtcCalendarDays(referenceDay, EXPENSE_DUE_SOON_DAYS);
  if (dueDay !== null && dueDay > referenceDay && dueDay <= soonEnd) {
    return 'DUE_SOON';
  }
  return 'PLANNED';
}

/** Recompute PLANNED / DUE_SOON / DUE_NOW / OVERDUE from due date; keep manual/off-board statuses. */
export function refreshExpenseWorkflowStatus(
  stored: ExpenseStatusEnum,
  dueDate: Date | null | undefined,
  referenceDay?: string,
): ExpenseStatusEnum {
  if (stored === 'PAID' || stored === 'BACKLOG' || stored === 'CANCELLED' || stored === 'ON_HOLD') {
    return stored;
  }
  if (stored === 'DUE_NOW') {
    return 'DUE_NOW';
  }
  if (TIME_BASED_STATUSES.has(stored) || !STORED_MANUAL_STATUSES.has(stored)) {
    return deriveTimeBasedWorkflowStatus(dueDate, referenceDay);
  }
  return stored;
}

export function isExpenseBoardColumnStatus(status: string): status is ExpenseBoardColumnStatus {
  return (EXPENSE_BOARD_COLUMN_STATUSES as readonly string[]).includes(status);
}
