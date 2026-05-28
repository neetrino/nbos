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

  const sourceLabel =
    kpi.source === 'LINE_OVERRIDE'
      ? 'Legacy employee override'
      : 'Resolved from payroll policy inputs';

  return (
    <DetailSheetSection title="Sales KPI payout result">
      <p className="text-muted-foreground text-xs">{sourceLabel}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-snug">
        KPI policy is managed in My Company. This section is read-only payroll outcome data for
        already attached bonuses.
      </p>
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
