'use client';

import { Handshake, Target, TrendingUp, Users } from 'lucide-react';
import { AmdCurrencyIcon } from '@/components/shared';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import { formatGroupedNumber } from '@/lib/format/money';
import type { LazyReportTabState } from '../../hooks/useLazyReportTabData';
import type { SalesReportsTabData } from '../../hooks/useReportTabData';
import { count } from '../../report-number-format';
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
          <ChartCard title="Deal pipeline funnel" description="Deal count by current stage.">
            <ReportBarChart data={dealStatusChart(data)} />
          </ChartCard>
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Deal value by type"
              description="Potential revenue grouped by deal type."
            >
              <ReportBarChart data={dealTypeValueChart(data)} />
            </ChartCard>
            <ChartCard
              title="Lead source distribution"
              description="Where leads enter the pipeline."
            >
              <ReportPieChart data={leadSourceChart(data)} />
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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)]">
      <KpiCard
        size="emphasis"
        label="Leads"
        value={count(data.leads.total)}
        icon={<Users size={18} />}
      />
      <KpiCard
        size="emphasis"
        label="Active deals"
        value={count(activeDeals)}
        icon={<Handshake size={18} />}
      />
      <KpiCard size="emphasis" label="Won deals" value={count(won)} icon={<Target size={18} />} />
      <KpiCard
        size="emphasis"
        label="Pipeline value"
        value={
          <span className="inline-flex items-baseline gap-1">
            {formatGroupedNumber(pipelineValue)}
            <AmdCurrencyIcon className="text-xl font-semibold leading-none" />
          </span>
        }
        icon={<TrendingUp size={18} />}
      />
    </section>
  );
}

function dealStatusChart(data: SalesReportsTabData): ChartDatum[] {
  return data.deals.byStatus.map((row) => ({
    name: (getDealStage(row.status)?.shortLabel ?? row.status).toUpperCase(),
    value: row._count,
  }));
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
