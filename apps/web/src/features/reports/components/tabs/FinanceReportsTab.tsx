'use client';

import { Banknote, ChartNoAxesCombined, CircleDollarSign, TrendingUp } from 'lucide-react';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import type { FinanceReportsTabData } from '../../hooks/useReportTabData';
import { count, money, numberValue, percent } from '../../report-number-format';
import { ChartCard } from '../charts/ChartCard';
import { KpiCard } from '../charts/KpiCard';
import { ReportAreaChart, ReportBarChart, type ChartDatum } from '../charts/ReportCharts';
import { ReportTabState } from './ReportTabState';

interface FinanceReportsTabProps {
  state: LazyReportTabState<FinanceReportsTabData>;
}

export function FinanceReportsTab({ state }: FinanceReportsTabProps) {
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <FinanceKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Company P&L"
              description="Revenue, costs and net margin from Finance-owned cash-basis reports."
            >
              <ReportBarChart data={companyPnlChart(data)} />
            </ChartCard>
            <ChartCard
              title="Cash movement forecast"
              description="Expected 30/60/90 day net movement from open finance facts."
            >
              <ReportAreaChart data={cashForecastChart(data)} />
            </ChartCard>
            <ChartCard
              title="MRR movement"
              description="Active, new and churned recurring revenue."
            >
              <ReportBarChart data={mrrChart(data)} />
            </ChartCard>
            <ChartCard
              title="Expense plan control"
              description="Plan, generated cards and paid amount."
            >
              <ReportBarChart data={expensePlanChart(data)} />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FinanceKpis({ data }: { data: FinanceReportsTabData }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Revenue"
        value={money(data.companyPnl.revenue.incomingPayments)}
        hint={`${count(data.companyPnl.revenue.paymentCount)} payment rows`}
        icon={<CircleDollarSign size={18} />}
      />
      <KpiCard
        label="Net profit"
        value={money(data.companyPnl.profitability.netProfit)}
        hint={`Margin ${percent(data.companyPnl.profitability.marginPercent)}`}
        icon={<TrendingUp size={18} />}
      />
      <KpiCard
        label="Active MRR"
        value={money(data.mrrSubscriptionRevenue.active.activeMrr)}
        hint={`${count(data.mrrSubscriptionRevenue.active.activeSubscriptionCount)} subscriptions`}
        icon={<ChartNoAxesCombined size={18} />}
      />
      <KpiCard
        label="Payroll payable"
        value={money(data.payrollReport.totals.totalPayable)}
        hint={`${percent(data.payrollReport.totals.payrollAsPercentOfRevenue)} of revenue`}
        icon={<Banknote size={18} />}
      />
    </section>
  );
}

function companyPnlChart(data: FinanceReportsTabData): ChartDatum[] {
  return [
    { name: 'Revenue', value: numberValue(data.companyPnl.revenue.incomingPayments) },
    { name: 'Costs', value: numberValue(data.companyPnl.costs.actualExpensePayments) },
    { name: 'Payroll', value: numberValue(data.companyPnl.costs.payrollExpensePayments) },
    { name: 'Net profit', value: numberValue(data.companyPnl.profitability.netProfit) },
  ];
}

function cashForecastChart(data: FinanceReportsTabData): ChartDatum[] {
  return data.cashFlow.forecast.buckets.map((bucket) => ({
    name: `${bucket.horizonDays}d`,
    value: numberValue(bucket.netExpected),
  }));
}

function mrrChart(data: FinanceReportsTabData): ChartDatum[] {
  return [
    { name: 'Active', value: numberValue(data.mrrSubscriptionRevenue.active.activeMrr) },
    { name: 'New', value: numberValue(data.mrrSubscriptionRevenue.movement.newMrr) },
    { name: 'Churned', value: numberValue(data.mrrSubscriptionRevenue.movement.churnedMrr) },
  ];
}

function expensePlanChart(data: FinanceReportsTabData): ChartDatum[] {
  return [
    { name: 'Planned', value: numberValue(data.expensePlanVsActual.totals.plannedAmount) },
    { name: 'Cards', value: numberValue(data.expensePlanVsActual.totals.generatedCardAmount) },
    { name: 'Paid', value: numberValue(data.expensePlanVsActual.totals.paidAmount) },
  ];
}
