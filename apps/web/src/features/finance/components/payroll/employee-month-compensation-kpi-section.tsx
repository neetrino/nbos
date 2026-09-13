'use client';

import Link from 'next/link';
import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSection } from '@/components/shared';
import { translateSalesKpiSource } from '@/features/finance/components/payroll/payroll-compensation-i18n';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

export function EmployeeMonthCompensationKpiSection({ detail }: { detail: SalaryLineMonthDetail }) {
  const t = useTranslations('payroll');

  if (!detail.hasKpiPolicy) {
    return null;
  }

  const kpi = detail.employeeSalesKpi;
  const summary = buildSalesKpiGateSummary(kpi.planAmount, kpi.actualAmount, t);
  const earnedLabel =
    detail.earnedPeriod != null ? formatPayrollMonthShort(detail.earnedPeriod) : '—';

  return (
    <DetailSheetSection
      title={t('compensation.kpi.title')}
      icon={<Target className="size-4" aria-hidden />}
    >
      <p className="text-muted-foreground text-xs">
        {t('compensation.kpi.earnedPayoutMonths', {
          earned: earnedLabel,
          payout: formatPayrollMonthShort(detail.payrollMonth),
        })}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">{translateSalesKpiSource(kpi.source, t)}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-snug">
        {t('compensation.kpi.policyManagedPrefix')}{' '}
        <Link href="/my-company/compensation" className="text-primary font-medium hover:underline">
          {t('compensation.kpi.policyManagedLink')}
        </Link>
        {t('compensation.kpi.policyManagedSuffix')}
      </p>
      {kpi.source === 'NOT_SYNCED' ? (
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          {t('compensation.kpi.notSyncedDetail', { earned: earnedLabel })}
        </p>
      ) : null}
      {summary ? (
        <p className="text-muted-foreground mt-2 text-sm leading-snug">{summary}</p>
      ) : null}
      {kpi.attainmentPct != null ? (
        <p className="text-muted-foreground mt-2 text-xs tabular-nums">
          {t('compensation.kpi.attainment', { pct: kpi.attainmentPct })}
        </p>
      ) : null}
      {kpi.effectivePayoutScaleLabel ? (
        <p className="text-foreground mt-2 text-sm font-medium">{kpi.effectivePayoutScaleLabel}</p>
      ) : null}
    </DetailSheetSection>
  );
}
