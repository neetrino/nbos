import type { SavedReportView } from '@/lib/api/reports';

export interface ReportFilterState {
  dateFrom: string;
  dateTo: string;
  asOf: string;
}

export function buildInitialReportFilters(): ReportFilterState {
  const now = new Date();
  return {
    dateFrom: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    dateTo: toDateInputValue(now),
    asOf: toDateInputValue(now),
  };
}

export function buildReportFilters(filters: ReportFilterState): Record<string, string> {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim().length > 0));
}

export function formatReportFilters(
  filters: Record<string, string | number | boolean | null>,
): string {
  const entries = Object.entries(filters).filter(([, value]) => value !== null && value !== '');
  if (entries.length === 0) return 'none';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
}

export function savedViewToFilters(view: SavedReportView): ReportFilterState {
  return {
    dateFrom: stringFilterValue(view.filters, 'dateFrom'),
    dateTo: stringFilterValue(view.filters, 'dateTo'),
    asOf: stringFilterValue(view.filters, 'asOf'),
  };
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stringFilterValue(
  filters: Record<string, string | number | boolean | null> | null,
  key: string,
): string {
  const value = filters?.[key];
  return typeof value === 'string' ? value : '';
}
