'use client';

import { Handshake, Lock, Target, TrendingUp, Users } from 'lucide-react';
import { AmdCurrencyIcon, EmptyState } from '@/components/shared';
import { getDealStage } from '@/features/crm/constants/dealPipeline';
import { formatGroupedNumber } from '@/lib/format/money';
import type { DealStats } from '@/lib/api/deals';
import type { LeadStats } from '@/lib/api/leads';
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

/**
 * Lead and deal blocks render independently: the tab opens on `DASHBOARDS VIEW`, while the numbers
 * behind it belong to `CRM_LEADS` and `CRM_DEALS`. A role holding only one of them sees only that
 * half instead of a failed tab.
 */
export function SalesReportsTab({ state }: SalesReportsTabProps) {
  const data = state.data;
  const leads = data?.leads ?? null;
  const deals = data?.deals ?? null;

  if (data && !leads && !deals) {
    return (
      <EmptyState
        icon={Lock}
        title="Sales reports are not available for your role"
        description="Lead and deal statistics require CRM access. Ask an administrator to grant it in Settings → Permissions."
      />
    );
  }

  return (
    <div className="space-y-5">
      <ReportTabState {...state} />
      {data ? (
        <>
          <SalesKpis leads={leads} deals={deals} />
          {deals ? (
            <ChartCard title="Deal pipeline funnel" description="Deal count by current stage.">
              <ReportBarChart data={dealStatusChart(deals)} />
            </ChartCard>
          ) : null}
          <div className="grid gap-5 xl:grid-cols-2">
            {deals ? (
              <ChartCard
                title="Deal value by type"
                description="Potential revenue grouped by deal type."
              >
                <ReportBarChart data={dealTypeValueChart(deals)} />
              </ChartCard>
            ) : null}
            {leads ? (
              <ChartCard
                title="Lead source distribution"
                description="Where leads enter the pipeline."
              >
                <ReportPieChart data={leadSourceChart(leads)} />
              </ChartCard>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SalesKpis({ leads, deals }: { leads: LeadStats | null; deals: DealStats | null }) {
  const won = deals?.byStatus.find((row) => row.status === 'WON')?._count ?? 0;
  const activeDeals = (deals?.byStatus ?? [])
    .filter((row) => row.status !== 'WON' && row.status !== 'FAILED')
    .reduce((sum, row) => sum + row._count, 0);
  const pipelineValue = (deals?.byStatus ?? []).reduce(
    (sum, row) => sum + Number(row._sum?.amount ?? 0),
    0,
  );

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)]">
      {leads ? (
        <KpiCard
          size="emphasis"
          label="Leads"
          value={count(leads.total)}
          icon={<Users size={18} />}
        />
      ) : null}
      {deals ? (
        <>
          <KpiCard
            size="emphasis"
            label="Active deals"
            value={count(activeDeals)}
            icon={<Handshake size={18} />}
          />
          <KpiCard
            size="emphasis"
            label="Won deals"
            value={count(won)}
            icon={<Target size={18} />}
          />
          <KpiCard
            size="emphasis"
            label="Pipeline value"
            value={
              <span className="inline-flex items-baseline gap-1">
                {formatGroupedNumber(pipelineValue)}
                <AmdCurrencyIcon className="text-xl leading-none font-semibold" />
              </span>
            }
            icon={<TrendingUp size={18} />}
          />
        </>
      ) : null}
    </section>
  );
}

function dealStatusChart(deals: DealStats): ChartDatum[] {
  return deals.byStatus.map((row) => ({
    name: (getDealStage(row.status)?.shortLabel ?? row.status).toUpperCase(),
    value: row._count,
  }));
}

function leadSourceChart(leads: LeadStats): ChartDatum[] {
  return leads.bySource.map((row) => ({ name: row.source || 'Unknown', value: row._count }));
}

function dealTypeValueChart(deals: DealStats): ChartDatum[] {
  return (deals.byType ?? []).map((row) => ({
    name: row.type,
    value: Number(row._sum?.amount ?? 0),
  }));
}
