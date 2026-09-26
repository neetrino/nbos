'use client';

import { DetailSheetSection } from '@/components/shared';
import type { KpiScorecardMetric, KpiScorecardPeriod } from './kpi-scorecard-metrics.types';

const PERIOD_LABEL: Record<KpiScorecardPeriod, string> = {
  WEEK: 'Weekly',
  MONTH: 'Monthly',
  QUARTER: 'Quarterly',
  SPRINT: 'Sprint',
};

const PLAIN_COPY: Record<string, string> = {
  DEALS_CLOSED: 'Closed deals this month.',
  REVENUE_GENERATED: 'Money collected. Payroll uses this as the result.',
  REVENUE_TARGET: 'The monthly plan payroll compares against.',
  CONVERSION_RATE: 'Share of qualified leads that became won deals.',
};

export function KpiPolicyScorecardMetrics({ metrics }: { metrics: KpiScorecardMetric[] }) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <DetailSheetSection title="What this gate watches" outlined>
      <p className="text-muted-foreground mb-3 text-xs leading-relaxed">
        Reference only. These names stay fixed.
      </p>
      <ul className="flex flex-col gap-1">
        {metrics.map((metric) => (
          <MetricRow key={metric.code} metric={metric} />
        ))}
      </ul>
    </DetailSheetSection>
  );
}

function MetricRow({ metric }: { metric: KpiScorecardMetric }) {
  const role =
    metric.payrollField === 'kpiSalesPlanAmount'
      ? 'Plan'
      : metric.payrollField === 'kpiSalesActualAmount'
        ? 'Result'
        : null;

  return (
    <li className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
        {metric.label.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-medium">{metric.label}</p>
        <p className="text-muted-foreground text-xs">
          {PLAIN_COPY[metric.code] ?? metric.description}
        </p>
      </div>
      <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
        {PERIOD_LABEL[metric.period]}
      </span>
      {role ? <span className="text-primary shrink-0 text-xs font-medium">{role}</span> : null}
    </li>
  );
}
