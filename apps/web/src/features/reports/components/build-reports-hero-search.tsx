import type { ReactNode } from 'react';
import { IntegratedSearchFilters } from '@/components/shared';
import type { SavedReportView } from '@/lib/api/reports';
import {
  buildReportsPeriodFilterConfig,
  buildReportsSavedViewFilterConfig,
  parseReportsPeriodFilterValue,
  periodPresetFromFilters,
  REPORTS_PERIOD_FILTER_KEY,
  REPORTS_SAVED_VIEW_FILTER_KEY,
} from '@/features/reports/constants/reports-period-filter';
import {
  buildReportPresetFilters,
  savedViewToFilters,
  type ReportFilterState,
} from '@/features/reports/report-filters';

type BuildReportsHeroSearchParams = {
  search: string;
  onSearchChange: (search: string) => void;
  filters: ReportFilterState;
  onFiltersChange: (filters: ReportFilterState) => void;
  savedViews: SavedReportView[];
  onClearAll: () => void;
};

export function buildReportsHeroSearch({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  savedViews,
  onClearAll,
}: BuildReportsHeroSearchParams): ReactNode {
  const periodPreset = periodPresetFromFilters(filters.dateFrom, filters.dateTo, filters.asOf);
  const periodValue =
    periodPreset === 'CUSTOM' ? parseReportsPeriodFilterValue('THIS_MONTH') : periodPreset;

  const filterConfigs = [
    buildReportsPeriodFilterConfig(),
    buildReportsSavedViewFilterConfig(savedViews),
  ];

  const filterValues = {
    [REPORTS_PERIOD_FILTER_KEY]: periodValue,
    [REPORTS_SAVED_VIEW_FILTER_KEY]: 'all',
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === REPORTS_PERIOD_FILTER_KEY) {
      onFiltersChange(buildReportPresetFilters(parseReportsPeriodFilterValue(value)));
      return;
    }
    if (key === REPORTS_SAVED_VIEW_FILTER_KEY && value !== 'all') {
      const view = savedViews.find((item) => item.id === value);
      if (view) {
        onFiltersChange(savedViewToFilters(view));
      }
    }
  };

  return (
    <IntegratedSearchFilters
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search reports by title or description…"
      filters={filterConfigs}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      onClearAll={onClearAll}
    />
  );
}
