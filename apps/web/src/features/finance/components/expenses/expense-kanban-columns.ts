import type { Expense } from '../../../../lib/api/finance';
import { EXPENSE_STAGES } from '../../constants/finance';

const STAGE_COLORS: Record<string, string> = {
  THIS_MONTH: 'bg-blue-500',
  PAY_NOW: 'bg-orange-500',
  DELAYED: 'bg-amber-500',
  ON_HOLD: 'bg-gray-400',
  PAID: 'bg-green-500',
  UNPAID: 'bg-red-500',
};

/** Prisma-backed statuses only (`OLD` exists in legacy UI labels but not in API enum). */
const KANBAN_STAGE_KEYS = new Set([
  'THIS_MONTH',
  'PAY_NOW',
  'DELAYED',
  'ON_HOLD',
  'PAID',
  'UNPAID',
]);

export function buildExpenseKanbanColumns(expenses: Expense[]) {
  return EXPENSE_STAGES.filter((s) => KANBAN_STAGE_KEYS.has(s.value)).map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: expenses.filter((e) => e.status === stage.value),
  }));
}
