'use client';

import Link from 'next/link';
import { DetailSheetSection } from '@/components/shared';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import type { EmployeeSalesKpiSource, SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

function payrollRunDetailHref(runId: string): string {
  return `/finance/payroll/${runId}`;
}

function sourceLabel(source: EmployeeSalesKpiSource): string {
  switch (source) {
    case 'KPI_RESULT':
      return 'Synced KPI result snapshot';
    case 'NO_KPI_POLICY':
      return 'No KPI policy on compensation profile';
    case 'NOT_SYNCED':
      return 'KPI snapshot not synced for this month';
  }
}

export function EmployeeMonthCompensationKpiSection({ detail }: { detail: SalaryLineMonthDetail }) {
  const kpi = detail.employeeSalesKpi;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount);
  const showSection =
    kpi.source === 'NOT_SYNCED' ||
    kpi.source === 'NO_KPI_POLICY' ||
    summary != null ||
    kpi.effectivePayoutScaleLabel != null;

  if (!showSection) {
    return null;
  }

  return (
    <DetailSheetSection title="Sales KPI payout result">
      <p className="text-muted-foreground text-xs">{sourceLabel(kpi.source)}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-snug">
        KPI policy is managed in My Company. Payroll uses synced monthly snapshots when attaching
        Sales bonuses.
      </p>
      {kpi.source === 'NOT_SYNCED' ? (
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          Sync Sales KPI on the{' '}
          <Link
            href={payrollRunDetailHref(detail.payrollRun.id)}
            className="text-primary font-medium hover:underline"
          >
            payroll run
          </Link>{' '}
          before attaching Sales bonus releases.
        </p>
      ) : null}
      {summary ? (
        <p className="text-muted-foreground mt-2 text-sm leading-snug">{summary}</p>
      ) : null}
      {kpi.attainmentPct != null ? (
        <p className="text-muted-foreground mt-2 text-xs tabular-nums">
          Attainment: {kpi.attainmentPct}%
        </p>
      ) : null}
      {kpi.effectivePayoutScaleLabel ? (
        <p className="text-foreground mt-2 text-sm font-medium">{kpi.effectivePayoutScaleLabel}</p>
      ) : null}
    </DetailSheetSection>
  );
}
