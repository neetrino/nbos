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

const BOARD_COLUMN_SET = new Set<string>(EXPENSE_BOARD_COLUMN_KEYS);

/**
 * Maps an expense to an NBOS Expense Board column (`docs/NBOS/02-Modules/04-Finance/04-Expenses.md`).
 * Workflow status is canonical; `PAID` / `BACKLOG` / `CANCELLED` are off-board (Closed / Backlog).
 */
export function resolveExpenseBoardColumn(
  expense: Pick<Expense, 'status' | 'dueDate'>,
): ExpenseBoardColumnKey | null {
  const { status } = expense;
  if (status === 'PAID' || status === 'BACKLOG' || status === 'CANCELLED') {
    return null;
  }
  if (BOARD_COLUMN_SET.has(status)) {
    return status as ExpenseBoardColumnKey;
  }
  return null;
}
