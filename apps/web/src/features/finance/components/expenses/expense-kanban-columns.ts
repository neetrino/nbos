import type { Expense } from '../../../../lib/api/finance';
import {
  EXPENSE_BOARD_COLUMNS,
  type ExpenseBoardColumnKey,
  resolveExpenseBoardColumn,
} from '../../constants/expense-board';

const COLUMN_COLORS: Record<ExpenseBoardColumnKey, string> = {
  PLANNED: 'bg-slate-500',
  DUE_SOON: 'bg-amber-500',
  DUE_NOW: 'bg-orange-500',
  OVERDUE: 'bg-red-600',
  ON_HOLD: 'bg-gray-400',
};

/**
 * NBOS Expense Board columns (`Planned`, `Due Soon`, `Due Now`, `Overdue`, `On Hold`).
 * `Paid` / deferred backlog cards belong off this board; list API uses `activeBoard` to match.
 */
export function buildExpenseKanbanColumns(expenses: Expense[]) {
  return EXPENSE_BOARD_COLUMNS.map((col) => ({
    key: col.key,
    label: col.label,
    color: COLUMN_COLORS[col.key],
    items: expenses.filter((e) => resolveExpenseBoardColumn(e) === col.key),
  }));
}
