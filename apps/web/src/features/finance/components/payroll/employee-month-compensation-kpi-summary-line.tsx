'use client';

import { useTranslations } from 'next-intl';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';

export function EmployeeMonthCompensationKpiSummaryLine({
  detail,
}: {
  detail: SalaryLineMonthDetail;
}) {
  const t = useTranslations('payroll');

  if (!detail.hasKpiPolicy) {
    return null;
  }

  const kpi = detail.employeeSalesKpi;
  const earned = detail.earnedPeriod != null ? formatPayrollMonthShort(detail.earnedPeriod) : null;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount, t);

  if (kpi.source === 'NOT_SYNCED') {
    return (
      <p className="text-muted-foreground text-xs leading-snug">
        {t('compensation.kpi.notSyncedSummary', { earned: earned ?? '—' })}
      </p>
    );
  }

  if (summary != null) {
    return <p className="text-muted-foreground text-xs leading-snug">{summary}</p>;
  }

  if (kpi.effectivePayoutScaleLabel != null) {
    return (
      <p className="text-muted-foreground text-xs leading-snug">
        {t('compensation.kpi.earnedScale', {
          earned: earned ?? '—',
          scale: kpi.effectivePayoutScaleLabel,
        })}
      </p>
    );
  }

  return null;
}
