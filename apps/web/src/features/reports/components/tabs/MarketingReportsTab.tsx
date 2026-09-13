'use client';

import { AlertTriangle, BadgeDollarSign, Megaphone, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MarketingDashboardSummary } from '@/lib/api/marketing';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import { count, money, ratio } from '../../report-number-format';
import { ChartCard } from '../charts/ChartCard';
import { KpiCard } from '../charts/KpiCard';
import { ReportBarChart, ReportPieChart, type ChartDatum } from '../charts/ReportCharts';
import { ReportTabState } from './ReportTabState';

interface MarketingReportsTabProps {
  state: LazyReportTabState<MarketingDashboardSummary>;
}

export function MarketingReportsTab({ state }: MarketingReportsTabProps) {
  const t = useTranslations('marketing');
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState
        {...state}
        loadingLabel={t('reports.loading')}
        unavailableLabel={t('reports.unavailable')}
        tryAgainLabel={t('reports.tryAgain')}
        loadedAtLabel={
          state.loadedAt
            ? t('reports.loadedAt', { time: state.loadedAt.toLocaleTimeString() })
            : undefined
        }
      />
      {data ? (
        <>
          <MarketingKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title={t('reports.spendVsRevenue')}
              description={spendRevenueChartDescription(data, t)}
            >
              <ReportBarChart data={spendRevenueChart(data, t)} />
            </ChartCard>
            <ChartCard title={t('reports.readiness')} description={t('reports.readinessHint')}>
              <ReportPieChart data={readinessChart(data, t)} />
            </ChartCard>
            <MarketingWarnings data={data} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MarketingKpis({ data }: { data: MarketingDashboardSummary }) {
  const t = useTranslations('marketing');
  const showCostKpis = data.money.roiMetricsAvailable;

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={t('reports.activities')}
        value={count(data.totals.activities)}
        icon={<Megaphone size={18} />}
      />
      <KpiCard
        label={t('reports.paidRevenue')}
        value={money(data.money.paidRevenue)}
        icon={<BadgeDollarSign size={18} />}
      />
      {showCostKpis ? (
        <>
          <KpiCard
            label={t('reports.roas')}
            value={ratio(data.money.roas)}
            icon={<TrendingUp size={18} />}
          />
          <KpiCard
            label={t('reports.cpl')}
            value={money(data.money.costPerAttributedLead)}
            icon={<TrendingUp size={18} />}
          />
        </>
      ) : (
        <KpiCard
          label={t('reports.cplRoas')}
          value="—"
          hint={t('reports.cplHint')}
          icon={<TrendingUp size={18} />}
        />
      )}
      <KpiCard
        label={t('reports.warnings')}
        value={count(data.warnings.length)}
        icon={<AlertTriangle size={18} />}
      />
    </section>
  );
}

function MarketingWarnings({ data }: { data: MarketingDashboardSummary }) {
  const t = useTranslations('marketing');
  return (
    <ChartCard title={t('reports.qualityTitle')} description={t('reports.qualityHint')}>
      <div className="space-y-3">
        {data.warnings.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('reports.noWarnings')}</p>
        ) : (
          data.warnings.map((warning) => (
            <div key={warning.code} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">{warning.message}</p>
              <p className="text-xs text-amber-700">
                {t('reports.affected', { count: warning.count })}
              </p>
            </div>
          ))
        )}
      </div>
    </ChartCard>
  );
}

function spendRevenueChartDescription(
  data: MarketingDashboardSummary,
  t: ReturnType<typeof useTranslations<'marketing'>>,
): string {
  const base = t('reports.spendBase');
  if (!data.money.roiMetricsAvailable) {
    return `${base} ${t('reports.spendHidden')}`;
  }
  if (data.money.netReturn === null) {
    return base;
  }
  return `${base} ${t('reports.spendNet')}`;
}

function spendRevenueChart(
  data: MarketingDashboardSummary,
  t: ReturnType<typeof useTranslations<'marketing'>>,
): ChartDatum[] {
  const rows: ChartDatum[] = [
    { name: t('reports.seriesSpend'), value: data.money.paidMarketingSpend },
    { name: t('reports.seriesRevenue'), value: data.money.paidRevenue },
  ];
  if (data.money.netReturn !== null) {
    rows.push({ name: t('reports.seriesNet'), value: data.money.netReturn });
  }
  return rows;
}

function readinessChart(
  data: MarketingDashboardSummary,
  t: ReturnType<typeof useTranslations<'marketing'>>,
): ChartDatum[] {
  return [
    { name: t('reports.seriesLinked'), value: data.totals.activitiesWithFinanceExpense },
    { name: t('reports.seriesMissing'), value: data.totals.missingFinanceLinks },
    { name: t('reports.seriesWon'), value: data.totals.wonAttributedDeals },
  ];
}
