'use client';

import { DetailSheetSection } from '@/components/shared';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

export function EmployeeMonthCompensationKpiSection({ detail }: { detail: SalaryLineMonthDetail }) {
  const kpi = detail.employeeSalesKpi;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount);
  if (!summary && !kpi.effectivePayoutScaleLabel) {
    return null;
  }

  const sourceLabel = kpi.source === 'LINE_OVERRIDE' ? 'Employee override' : 'Payroll run default';

  return (
    <DetailSheetSection title="Sales KPI (effective at attach)">
      <p className="text-muted-foreground text-xs">{sourceLabel}</p>
      {summary ? (
        <p className="text-muted-foreground mt-2 text-sm leading-snug">{summary}</p>
      ) : null}
      {kpi.effectivePayoutScaleLabel ? (
        <p className="text-foreground mt-2 text-sm font-medium">{kpi.effectivePayoutScaleLabel}</p>
      ) : null}
      {kpi.source === 'LINE_OVERRIDE' ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Run default: plan {detail.payrollRun.kpiSalesPlanAmount ?? '—'}, actual{' '}
          {detail.payrollRun.kpiSalesActualAmount ?? '—'}
        </p>
      ) : null}
    </DetailSheetSection>
  );
}
