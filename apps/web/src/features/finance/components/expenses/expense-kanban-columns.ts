import { EXPENSE_STAGES } from '@/features/finance/constants/finance';
import type { Expense } from '@/lib/api/finance';

const STAGE_COLORS: Record<string, string> = {
  THIS_MONTH: 'bg-blue-500',
  PAY_NOW: 'bg-orange-500',
  DELAYED: 'bg-amber-500',
  ON_HOLD: 'bg-gray-400',
  PAID: 'bg-green-500',
};

const KANBAN_STAGE_KEYS = new Set(['THIS_MONTH', 'PAY_NOW', 'DELAYED', 'ON_HOLD', 'PAID']);

export function buildExpenseKanbanColumns(expenses: Expense[]) {
  return EXPENSE_STAGES.filter((s) => KANBAN_STAGE_KEYS.has(s.value)).map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: expenses.filter((e) => e.status === stage.value),
  }));
}
