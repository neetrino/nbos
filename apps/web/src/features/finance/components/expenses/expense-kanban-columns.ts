import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { Expense } from '../../../../lib/api/finance';
import {
  EXPENSE_BOARD_COLUMNS,
  EXPENSE_CLOSED_BOARD_COLUMNS,
  type ExpenseBoardColumnKey,
  type ExpenseClosedBoardColumnKey,
  resolveExpenseBoardColumn,
  resolveExpenseClosedBoardColumn,
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
  return EXPENSE_BOARD_COLUMNS.map((col) => {
    const color = COLUMN_COLORS[col.key];
    return {
      key: col.key,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: expenses.filter((e) => resolveExpenseBoardColumn(e) === col.key),
    };
  });
}

const CLOSED_COLUMN_COLORS: Record<ExpenseClosedBoardColumnKey, string> = {
  PAID: 'bg-green-600',
  CANCELLED: 'bg-red-500',
};

/** Closed expense route: terminal outcomes only (Paid / Cancelled). */
export function buildExpenseClosedKanbanColumns(expenses: Expense[]) {
  return EXPENSE_CLOSED_BOARD_COLUMNS.map((col) => {
    const color = CLOSED_COLUMN_COLORS[col.key];
    return {
      key: col.key,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: expenses.filter((e) => resolveExpenseClosedBoardColumn(e) === col.key),
    };
  });
}
