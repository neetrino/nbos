import type { FilterConfig } from '@/components/shared/FilterBar';
import { EXPENSE_PLAN_BOARD_COLUMN_ORDER } from '@/features/finance/constants/expense-plans-board-columns';

export const EXPENSE_PLAN_PERIOD_FILTER_KEY = 'period' as const;
export const EXPENSE_PLAN_PERIOD_FILTER_ALL = 'all' as const;

const LEADING_PERIOD_VALUES = ['MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
const LEADING_PERIOD_VALUE_SET = new Set<string>(LEADING_PERIOD_VALUES);

/** Recurring cadences first (Monthly / Quarterly / Yearly), then the remaining plan frequencies. */
export const EXPENSE_PLAN_PERIOD_FILTER_VALUES = [
  ...LEADING_PERIOD_VALUES,
  ...EXPENSE_PLAN_BOARD_COLUMN_ORDER.filter((value) => !LEADING_PERIOD_VALUE_SET.has(value)),
] as const;

export type ExpensePlanPeriodFilterValue = (typeof EXPENSE_PLAN_PERIOD_FILTER_VALUES)[number];

const PERIOD_FILTER_VALUES = new Set<string>(EXPENSE_PLAN_PERIOD_FILTER_VALUES);

export interface ExpensePlanPeriodFilterLabels {
  period: string;
  allPeriods: string;
  frequencyLabel: (value: string) => string;
}

export function buildExpensePlanPeriodFilterConfig(
  labels?: ExpensePlanPeriodFilterLabels,
): FilterConfig {
  return {
    key: EXPENSE_PLAN_PERIOD_FILTER_KEY,
    label: labels?.period ?? 'Period',
    includeAllOption: false,
    defaultOptionValue: EXPENSE_PLAN_PERIOD_FILTER_ALL,
    options: [
      ...EXPENSE_PLAN_PERIOD_FILTER_VALUES.map((value) => ({
        value,
        label: labels?.frequencyLabel(value) ?? value,
      })),
      { value: EXPENSE_PLAN_PERIOD_FILTER_ALL, label: labels?.allPeriods ?? 'All' },
    ],
  };
}

export function parseExpensePlanPeriodFilterValue(raw: string | null): string {
  const value = raw?.trim();
  if (!value || value === EXPENSE_PLAN_PERIOD_FILTER_ALL) {
    return EXPENSE_PLAN_PERIOD_FILTER_ALL;
  }
  return PERIOD_FILTER_VALUES.has(value) ? value : EXPENSE_PLAN_PERIOD_FILTER_ALL;
}

/** Maps the Period filter to the list/grid `frequency` query (omit = every cadence). */
export function resolveExpensePlanPeriodApiParam(
  periodFilter: string | undefined,
): string | undefined {
  const value = periodFilter?.trim();
  if (!value || value === EXPENSE_PLAN_PERIOD_FILTER_ALL) {
    return undefined;
  }
  return PERIOD_FILTER_VALUES.has(value) ? value : undefined;
}
