import type { ReactNode } from 'react';
import { IntegratedSearchFilters } from '@/components/shared';
import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  buildFinancePeriodFilterConfig,
  FINANCE_PERIOD_FILTER_KEY,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import type { FinancePeriod } from '@/features/finance/constants/finance';

type BuildFinanceOverviewHeroSearchParams = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  period: FinancePeriod;
  onPeriodChange: (period: FinancePeriod) => void;
  onClearAll: () => void;
  extraFilters?: FilterConfig[];
  extraFilterValues?: Record<string, string>;
  onExtraFilterChange?: (key: string, value: string) => void;
};

export function buildFinanceOverviewHeroSearch({
  search,
  onSearchChange,
  searchPlaceholder,
  period,
  onPeriodChange,
  onClearAll,
  extraFilters = [],
  extraFilterValues = {},
  onExtraFilterChange,
}: BuildFinanceOverviewHeroSearchParams): ReactNode {
  const filters = [buildFinancePeriodFilterConfig(), ...extraFilters];

  const filterValues = {
    [FINANCE_PERIOD_FILTER_KEY]: period,
    ...extraFilterValues,
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === FINANCE_PERIOD_FILTER_KEY) {
      onPeriodChange(parseFinancePeriodFilterValue(value));
      return;
    }
    onExtraFilterChange?.(key, value);
  };

  return (
    <IntegratedSearchFilters
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      onClearAll={onClearAll}
    />
  );
}
