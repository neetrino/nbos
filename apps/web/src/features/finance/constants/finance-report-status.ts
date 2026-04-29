import type { FinanceReportDefinition } from '@/lib/api/finance-reports';

export function financeReportStatusLabel(status: FinanceReportDefinition['v1Status']): string {
  if (status === 'definition_ready') return 'Definition ready';
  if (status === 'partial_sources') return 'Partial sources';
  return 'Needs aggregate endpoint';
}

export function financeReportStatusClass(status: FinanceReportDefinition['v1Status']): string {
  if (status === 'definition_ready') return 'bg-emerald-50 text-emerald-700';
  if (status === 'partial_sources') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
}
