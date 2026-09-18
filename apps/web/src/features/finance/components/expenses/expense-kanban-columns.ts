import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type { Expense } from '../../../../lib/api/finance';
import { EXPENSE_STAGE_COLOR_CLASS } from '../../constants/expense-stage-colors';
import {
  EXPENSE_BOARD_COLUMNS,
  EXPENSE_CLOSED_BOARD_COLUMNS,
  resolveExpenseBoardColumn,
  resolveExpenseClosedBoardColumn,
} from '../../constants/expense-board';

/**
 * NBOS Expense Board columns (`Planned`, `Due Soon`, `Due Now`, `Overdue`, `On Hold`).
 * `Paid` / deferred backlog cards belong off this board; list API uses `activeBoard` to match.
 */
export function buildExpenseKanbanColumns(expenses: Expense[]) {
  return EXPENSE_BOARD_COLUMNS.map((col) => {
    const color = EXPENSE_STAGE_COLOR_CLASS[col.key];
    return {
      key: col.key,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: expenses.filter((e) => resolveExpenseBoardColumn(e) === col.key),
    };
  });
}

/** Closed Pay now: terminal outcomes only (Paid / Cancelled). */
export function buildExpenseClosedKanbanColumns(expenses: Expense[]) {
  return EXPENSE_CLOSED_BOARD_COLUMNS.map((col) => {
    const color = EXPENSE_STAGE_COLOR_CLASS[col.key];
    return {
      key: col.key,
      label: col.label,
      color,
      hexColor: resolveKanbanStageHex(color),
      items: expenses.filter((e) => resolveExpenseClosedBoardColumn(e) === col.key),
    };
  });
}

/** Pay now All: working lanes plus terminal outcomes (no Backlog). */
export function buildExpenseLifecycleKanbanColumns(expenses: Expense[]) {
  return [...buildExpenseKanbanColumns(expenses), ...buildExpenseClosedKanbanColumns(expenses)];
}
