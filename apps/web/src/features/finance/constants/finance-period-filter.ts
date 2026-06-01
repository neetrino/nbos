import type { FilterConfig } from '@/components/shared/FilterBar';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';

export const FINANCE_PERIOD_FILTER_KEY = 'period' as const;

/** List/board views: no date scope until the user picks Month/Quarter/Year. */
export const FINANCE_DEFAULT_LIST_PERIOD: FinancePeriod = 'all';

const FINANCE_PERIOD_VALUES = new Set(FINANCE_PERIOD_OPTIONS.map((o) => o.value));

export function buildFinancePeriodFilterConfig(): FilterConfig {
  return {
    key: FINANCE_PERIOD_FILTER_KEY,
    label: 'Period',
    includeAllOption: false,
    defaultOptionValue: FINANCE_DEFAULT_LIST_PERIOD,
    options: FINANCE_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  };
}

export function parseFinancePeriodFilterValue(value: string): FinancePeriod {
  if (FINANCE_PERIOD_VALUES.has(value as FinancePeriod)) {
    return value as FinancePeriod;
  }
  return FINANCE_DEFAULT_LIST_PERIOD;
}
