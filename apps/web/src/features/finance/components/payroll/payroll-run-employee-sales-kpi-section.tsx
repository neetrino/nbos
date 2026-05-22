'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { payrollFieldLabel } from '@/features/finance/utils/payroll-sales-kpi-scorecard-labels';
import { buildSalesKpiGateSummary } from '@/features/finance/utils/sales-kpi-gate-summary';
import type { KpiScorecardMetric } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PatchSalaryLineSalesKpiBody,
  type SalaryLineRow,
} from '@/lib/api/payroll-runs';

function employeeName(emp: SalaryLineRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function moneyStringOrEmpty(value: string | null | undefined): string {
  return value ?? '';
}

function SalaryLineKpiRow({
  line,
  run,
  scorecardMetrics,
  disabled,
  onSaved,
}: {
  line: SalaryLineRow;
  run: PayrollRunDetail;
  scorecardMetrics: KpiScorecardMetric[];
  disabled: boolean;
  onSaved: (next: PayrollRunDetail) => void;
}) {
  const planLabel = payrollFieldLabel(scorecardMetrics, 'kpiSalesPlanAmount');
  const actualLabel = payrollFieldLabel(scorecardMetrics, 'kpiSalesActualAmount');
  const [plan, setPlan] = useState(moneyStringOrEmpty(line.kpiSalesPlanAmount));
  const [actual, setActual] = useState(moneyStringOrEmpty(line.kpiSalesActualAmount));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasOverride = line.kpiSalesPlanAmount != null || line.kpiSalesActualAmount != null;
  const summary = buildSalesKpiGateSummary(
    hasOverride ? line.kpiSalesPlanAmount : run.kpiSalesPlanAmount,
    hasOverride ? line.kpiSalesActualAmount : run.kpiSalesActualAmount,
  );

  const save = async () => {
    const planVal = plan.trim() === '' ? null : Number.parseFloat(plan);
    const actualVal = actual.trim() === '' ? null : Number.parseFloat(actual);
    if (plan.trim() !== '' && !Number.isFinite(planVal)) {
      setError('Plan must be a number.');
      return;
    }
    if (actual.trim() !== '' && !Number.isFinite(actualVal)) {
      setError('Actual must be a number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: PatchSalaryLineSalesKpiBody = {
        kpiSalesPlanAmount: plan.trim() === '' ? null : planVal,
        kpiSalesActualAmount: actual.trim() === '' ? null : actualVal,
      };
      const next = await payrollRunsApi.patchSalaryLineSalesKpi(run.id, line.id, body);
      onSaved(next);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not save employee KPI.'));
    } finally {
      setBusy(false);
    }
  };

  const clearOverride = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await payrollRunsApi.patchSalaryLineSalesKpi(run.id, line.id, {
        kpiSalesPlanAmount: null,
        kpiSalesActualAmount: null,
      });
      setPlan('');
      setActual('');
      onSaved(next);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not clear override.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="border-border rounded-lg border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-foreground text-sm font-medium">{employeeName(line.employee)}</span>
        <span className="text-muted-foreground text-xs">
          {hasOverride ? 'Line override' : 'Uses run default'}
        </span>
      </div>
      {summary ? (
        <p className="text-muted-foreground mb-2 text-xs leading-snug">{summary}</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">{planLabel ?? 'Plan'}</span>
          <Input
            value={plan}
            disabled={disabled || busy}
            onChange={(e) => setPlan(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">{actualLabel ?? 'Actual'}</span>
          <Input
            value={actual}
            disabled={disabled || busy}
            onChange={(e) => setActual(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Seller payments ({run.payrollMonth}, UTC):{' '}
            <span className="text-foreground font-medium tabular-nums">
              {moneyStringOrEmpty(line.kpiSalesActualSuggestedAmount)}
            </span>
          </p>
        </label>
      </div>
      {error ? <p className="text-destructive mt-2 text-xs">{error}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={disabled || busy} onClick={() => void save()}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => setActual(moneyStringOrEmpty(line.kpiSalesActualSuggestedAmount))}
        >
          Use seller payments
        </Button>
        {hasOverride ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || busy}
            onClick={() => void clearOverride()}
          >
            Use run default
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function PayrollRunEmployeeSalesKpiSection({
  run,
  scorecardMetrics = [],
  onUpdated,
}: {
  run: PayrollRunDetail;
  scorecardMetrics?: KpiScorecardMetric[];
  onUpdated: (next: PayrollRunDetail) => void;
}) {
  const editable =
    (run.status === 'DRAFT' || run.status === 'REVIEW') && run.includedBonusReleaseCount === 0;

  if (run.salaryLines.length === 0) {
    return null;
  }

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Employee sales KPI</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Optional per-employee plan/actual for SALES bonus attach. Empty fields use the run-level KPI
        above. Locked after any bonus release is attached to this run.
      </p>
      <ul className="mt-4 space-y-3">
        {run.salaryLines.map((line) => (
          <SalaryLineKpiRow
            key={line.id}
            line={line}
            run={run}
            scorecardMetrics={scorecardMetrics}
            disabled={!editable}
            onSaved={onUpdated}
          />
        ))}
      </ul>
    </section>
  );
}
