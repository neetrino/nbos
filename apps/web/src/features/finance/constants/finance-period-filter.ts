import type { FilterConfig } from '@/components/shared/FilterBar';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';

export const FINANCE_PERIOD_FILTER_KEY = 'period' as const;

const FINANCE_PERIOD_VALUES = new Set(FINANCE_PERIOD_OPTIONS.map((o) => o.value));

export function buildFinancePeriodFilterConfig(): FilterConfig {
  return {
    key: FINANCE_PERIOD_FILTER_KEY,
    label: 'Period',
    includeAllOption: false,
    defaultOptionValue: 'month',
    options: FINANCE_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  };
}

export function parseFinancePeriodFilterValue(value: string): FinancePeriod {
  if (FINANCE_PERIOD_VALUES.has(value as FinancePeriod)) {
    return value as FinancePeriod;
  }
  return 'month';
}
