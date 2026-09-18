import { resolveKanbanStageHex } from '@/components/shared/kanban/kanban-stage-hex';
import type {
  ExpenseBoardColumnKey,
  ExpenseClosedBoardColumnKey,
} from '@/features/finance/constants/expense-board';

const FALLBACK_STAGE_HEX = '#9CA3AF';

/** Shared Tailwind tokens for Expense kanban headers and the sheet pipeline. */
export const EXPENSE_STAGE_COLOR_CLASS: Record<
  ExpenseBoardColumnKey | ExpenseClosedBoardColumnKey,
  string
> = {
  PLANNED: 'bg-slate-500',
  DUE_SOON: 'bg-amber-500',
  DUE_NOW: 'bg-orange-500',
  OVERDUE: 'bg-red-600',
  ON_HOLD: 'bg-black',
  PAID: 'bg-green-600',
  CANCELLED: 'bg-red-500',
};

export const EXPENSE_STAGE_HEX: Record<string, string> = Object.fromEntries(
  Object.entries(EXPENSE_STAGE_COLOR_CLASS).map(([key, colorClass]) => [
    key,
    resolveKanbanStageHex(colorClass) ?? FALLBACK_STAGE_HEX,
  ]),
);
