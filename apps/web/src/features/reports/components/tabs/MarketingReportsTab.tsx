'use client';

import { AlertTriangle, BadgeDollarSign, Megaphone, TrendingUp } from 'lucide-react';
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
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <MarketingKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Paid spend vs revenue"
              description={spendRevenueChartDescription(data)}
            >
              <ReportBarChart data={spendRevenueChart(data)} />
            </ChartCard>
            <ChartCard title="Attribution readiness" description="Marketing signal health.">
              <ReportPieChart data={readinessChart(data)} />
            </ChartCard>
            <MarketingWarnings data={data} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function MarketingKpis({ data }: { data: MarketingDashboardSummary }) {
  const showCostKpis = data.money.roiMetricsAvailable;

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Activities"
        value={count(data.totals.activities)}
        icon={<Megaphone size={18} />}
      />
      <KpiCard
        label="Paid revenue"
        value={money(data.money.paidRevenue)}
        icon={<BadgeDollarSign size={18} />}
      />
      {showCostKpis ? (
        <>
          <KpiCard label="ROAS" value={ratio(data.money.roas)} icon={<TrendingUp size={18} />} />
          <KpiCard
            label="CPL (attrib. leads)"
            value={money(data.money.costPerAttributedLead)}
            icon={<TrendingUp size={18} />}
          />
        </>
      ) : (
        <KpiCard
          label="CPL / ROAS"
          value="—"
          hint="Shown only after Finance records paid spend on linked marketing expense plans and activity cards."
          icon={<TrendingUp size={18} />}
        />
      )}
      <KpiCard
        label="Warnings"
        value={count(data.warnings.length)}
        icon={<AlertTriangle size={18} />}
      />
    </section>
  );
}

function MarketingWarnings({ data }: { data: MarketingDashboardSummary }) {
  return (
    <ChartCard
      title="Data quality warnings"
      description="Reports never convert missing data into zeroes."
    >
      <div className="space-y-3">
        {data.warnings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No marketing data-quality warnings.</p>
        ) : (
          data.warnings.map((warning) => (
            <div key={warning.code} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">{warning.message}</p>
              <p className="text-xs text-amber-700">Affected records: {warning.count}</p>
            </div>
          ))
        )}
      </div>
    </ChartCard>
  );
}

function spendRevenueChartDescription(data: MarketingDashboardSummary): string {
  const base =
    'Paid marketing spend uses Finance payments on linked plans and activity expense cards (not budgets).';
  if (!data.money.roiMetricsAvailable) {
    return `${base} CPL/ROI and net return stay hidden until at least one payment is recorded.`;
  }
  if (data.money.netReturn === null) {
    return base;
  }
  return `${base} Net return uses paid spend and paid attributed revenue.`;
}

function spendRevenueChart(data: MarketingDashboardSummary): ChartDatum[] {
  const rows: ChartDatum[] = [
    { name: 'Paid marketing spend', value: data.money.paidMarketingSpend },
    { name: 'Paid revenue', value: data.money.paidRevenue },
  ];
  if (data.money.netReturn !== null) {
    rows.push({ name: 'Net return', value: data.money.netReturn });
  }
  return rows;
}

function readinessChart(data: MarketingDashboardSummary): ChartDatum[] {
  return [
    { name: 'Linked', value: data.totals.activitiesWithFinanceExpense },
    { name: 'Missing links', value: data.totals.missingFinanceLinks },
    { name: 'Won attributed', value: data.totals.wonAttributedDeals },
  ];
}
