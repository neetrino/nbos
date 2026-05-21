import type { ExpensePlan } from '@/lib/api/expense-plans';
import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';

export const EXPENSE_PLAN_BOARD_COLUMN_ORDER = [
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'MULTI_YEAR',
  'ONE_TIME',
] as const;

export type ExpensePlanBoardColumnKey = (typeof EXPENSE_PLAN_BOARD_COLUMN_ORDER)[number] | 'OTHER';

const COLUMN_COLORS: Record<ExpensePlanBoardColumnKey, string> = {
  MONTHLY: 'bg-blue-500',
  QUARTERLY: 'bg-violet-500',
  YEARLY: 'bg-indigo-600',
  MULTI_YEAR: 'bg-purple-600',
  ONE_TIME: 'bg-slate-500',
  OTHER: 'bg-gray-400',
};

export function resolveExpensePlanBoardColumn(frequency: string): ExpensePlanBoardColumnKey {
  const key = frequency.trim().toUpperCase();
  if ((EXPENSE_PLAN_BOARD_COLUMN_ORDER as readonly string[]).includes(key)) {
    return key as (typeof EXPENSE_PLAN_BOARD_COLUMN_ORDER)[number];
  }
  return 'OTHER';
}

export function buildExpensePlansKanbanColumns(plans: ExpensePlan[]) {
  const columnDefs: Array<{ key: ExpensePlanBoardColumnKey; label: string }> = [
    ...EXPENSE_PLAN_BOARD_COLUMN_ORDER.map((key) => ({
      key,
      label: expensePlanFrequencyLabel(key),
    })),
    { key: 'OTHER' as const, label: 'Other' },
  ];

  return columnDefs.map((col) => ({
    key: col.key,
    label: col.label,
    color: COLUMN_COLORS[col.key],
    items: plans.filter((p) => resolveExpensePlanBoardColumn(p.frequency) === col.key),
    readonly: true as const,
  }));
}
