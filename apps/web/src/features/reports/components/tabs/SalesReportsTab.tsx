'use client';

import { Handshake, Target, TrendingUp, Users } from 'lucide-react';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import type { SalesReportsTabData } from '../../hooks/useReportTabData';
import { count, money } from '../../report-number-format';
import { ChartCard } from '../charts/ChartCard';
import { KpiCard } from '../charts/KpiCard';
import { ReportBarChart, ReportPieChart, type ChartDatum } from '../charts/ReportCharts';
import { ReportTabState } from './ReportTabState';

interface SalesReportsTabProps {
  state: LazyReportTabState<SalesReportsTabData>;
}

export function SalesReportsTab({ state }: SalesReportsTabProps) {
  const data = state.data;

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <SalesKpis data={data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Deal pipeline funnel" description="Deal count by current stage.">
              <ReportBarChart data={dealStatusChart(data)} />
            </ChartCard>
            <ChartCard
              title="Lead source distribution"
              description="Where leads enter the pipeline."
            >
              <ReportPieChart data={leadSourceChart(data)} />
            </ChartCard>
            <ChartCard
              title="Deal value by type"
              description="Potential revenue grouped by deal type."
            >
              <ReportBarChart data={dealTypeValueChart(data)} />
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SalesKpis({ data }: { data: SalesReportsTabData }) {
  const won = data.deals.byStatus.find((row) => row.status === 'WON')?._count ?? 0;
  const activeDeals = data.deals.byStatus
    .filter((row) => row.status !== 'WON' && row.status !== 'FAILED')
    .reduce((sum, row) => sum + row._count, 0);
  const pipelineValue = data.deals.byStatus.reduce(
    (sum, row) => sum + Number(row._sum?.amount ?? 0),
    0,
  );

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Leads" value={count(data.leads.total)} icon={<Users size={18} />} />
      <KpiCard label="Active deals" value={count(activeDeals)} icon={<Handshake size={18} />} />
      <KpiCard label="Won deals" value={count(won)} icon={<Target size={18} />} />
      <KpiCard
        label="Pipeline value"
        value={money(pipelineValue)}
        icon={<TrendingUp size={18} />}
      />
    </section>
  );
}

function dealStatusChart(data: SalesReportsTabData): ChartDatum[] {
  return data.deals.byStatus.map((row) => ({ name: row.status, value: row._count }));
}

function leadSourceChart(data: SalesReportsTabData): ChartDatum[] {
  return data.leads.bySource.map((row) => ({ name: row.source || 'Unknown', value: row._count }));
}

function dealTypeValueChart(data: SalesReportsTabData): ChartDatum[] {
  return (data.deals.byType ?? []).map((row) => ({
    name: row.type,
    value: Number(row._sum?.amount ?? 0),
  }));
}
