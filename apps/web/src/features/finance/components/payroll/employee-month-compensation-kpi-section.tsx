'use client';

import Link from 'next/link';
import { Target } from 'lucide-react';
import { DetailSheetSection } from '@/components/shared';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';
import type { EmployeeSalesKpiSource, SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

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
  if (!detail.hasKpiPolicy) {
    return null;
  }

  const kpi = detail.employeeSalesKpi;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount);
  const earnedLabel =
    detail.earnedPeriod != null ? formatPayrollMonthShort(detail.earnedPeriod) : '—';

  return (
    <DetailSheetSection title="Sales KPI" icon={<Target className="size-4" aria-hidden />}>
      <p className="text-muted-foreground text-xs">
        Earned month {earnedLabel} · payout month {formatPayrollMonthShort(detail.payrollMonth)}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">{sourceLabel(kpi.source)}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-snug">
        KPI policy is managed in{' '}
        <Link href="/my-company/compensation" className="text-primary font-medium hover:underline">
          My Company → Compensation
        </Link>
        . Snapshots refresh automatically on client payments, bonus accrual, and payroll attach.
      </p>
      {kpi.source === 'NOT_SYNCED' ? (
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          No KPI snapshot for earned month {earnedLabel} yet. Included Sales bonuses will scale at
          attach once the month result is available.
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
