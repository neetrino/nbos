'use client';

import type { KpiScorecardMetric } from './kpi-scorecard-metrics.types';

export function KpiPolicyScorecardMetrics({ metrics }: { metrics: KpiScorecardMetric[] }) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <section className="border-border mt-4 rounded-lg border p-3">
      <h3 className="text-foreground text-sm font-medium">Scorecard metrics (reference)</h3>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Documented KPIs for this policy. Metrics linked to payroll feed SALES attach plan/actual on
        the payroll run.
      </p>
      <ul className="mt-3 space-y-2">
        {metrics.map((m) => (
          <li key={m.code} className="text-sm">
            <span className="text-foreground font-medium">{m.label}</span>
            <span className="text-muted-foreground ml-2 text-xs uppercase">{m.period}</span>
            {m.payrollField ? (
              <span className="text-primary ml-2 text-xs">
                → payroll {m.payrollField === 'kpiSalesPlanAmount' ? 'plan' : 'actual'}
              </span>
            ) : null}
            {m.description ? (
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{m.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
