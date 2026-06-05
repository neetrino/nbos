import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  buildReportPresetFilters,
  type ReportPeriodPreset,
} from '@/features/reports/report-filters';

export const REPORTS_PERIOD_FILTER_KEY = 'period' as const;
export const REPORTS_SAVED_VIEW_FILTER_KEY = 'savedView' as const;

export const REPORTS_DEFAULT_PERIOD: ReportPeriodPreset = 'THIS_MONTH';

const REPORT_PERIOD_VALUES = new Set<ReportPeriodPreset>([
  'THIS_MONTH',
  'THIS_QUARTER',
  'THIS_YEAR',
]);

export const REPORTS_PERIOD_OPTIONS = [
  { value: 'THIS_MONTH', label: 'Month' },
  { value: 'THIS_QUARTER', label: 'Quarter' },
  { value: 'THIS_YEAR', label: 'Year' },
] as const;

export function buildReportsPeriodFilterConfig(): FilterConfig {
  return {
    key: REPORTS_PERIOD_FILTER_KEY,
    label: 'Period',
    includeAllOption: false,
    defaultOptionValue: REPORTS_DEFAULT_PERIOD,
    options: REPORTS_PERIOD_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  };
}

export function parseReportsPeriodFilterValue(value: string): ReportPeriodPreset {
  if (REPORT_PERIOD_VALUES.has(value as ReportPeriodPreset)) {
    return value as ReportPeriodPreset;
  }
  return REPORTS_DEFAULT_PERIOD;
}

export function buildReportsSavedViewFilterConfig(
  savedViews: Array<{ id: string; name: string }>,
): FilterConfig {
  return {
    key: REPORTS_SAVED_VIEW_FILTER_KEY,
    label: 'Saved view',
    includeAllOption: true,
    allOptionLabel: 'No saved view',
    options: savedViews.map((view) => ({ value: view.id, label: view.name })),
  };
}

export function periodPresetFromFilters(
  dateFrom: string,
  dateTo: string,
  asOf: string,
): ReportPeriodPreset | 'CUSTOM' {
  for (const preset of REPORTS_PERIOD_OPTIONS) {
    const expected = buildReportPresetFilters(preset.value);
    if (expected.dateFrom === dateFrom && expected.dateTo === dateTo && expected.asOf === asOf) {
      return preset.value;
    }
  }
  return 'CUSTOM';
}
