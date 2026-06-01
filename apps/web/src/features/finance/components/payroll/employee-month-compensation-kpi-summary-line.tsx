'use client';

import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';

export function EmployeeMonthCompensationKpiSummaryLine({
  detail,
}: {
  detail: SalaryLineMonthDetail;
}) {
  if (!detail.hasKpiPolicy) {
    return null;
  }

  const kpi = detail.employeeSalesKpi;
  const earned = detail.earnedPeriod != null ? formatPayrollMonthShort(detail.earnedPeriod) : null;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount);

  if (kpi.source === 'NOT_SYNCED') {
    return (
      <p className="text-muted-foreground text-xs leading-snug">
        Sales KPI for earned month {earned ?? '—'} is not finalized yet. Bonuses in this payout
        month scale at attach once the snapshot exists.
      </p>
    );
  }

  if (summary != null) {
    return <p className="text-muted-foreground text-xs leading-snug">{summary}</p>;
  }

  if (kpi.effectivePayoutScaleLabel != null) {
    return (
      <p className="text-muted-foreground text-xs leading-snug">
        Earned {earned}: {kpi.effectivePayoutScaleLabel}
      </p>
    );
  }

  return null;
}
