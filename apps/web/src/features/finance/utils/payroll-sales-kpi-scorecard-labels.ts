import type { KpiScorecardMetric } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';

export function payrollFieldLabel(
  metrics: KpiScorecardMetric[],
  field: 'kpiSalesPlanAmount' | 'kpiSalesActualAmount',
): string | null {
  const hit = metrics.find((m) => m.payrollField === field);
  return hit ? hit.label : null;
}
