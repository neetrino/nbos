'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type PayrollRunDetail } from '@/lib/api/payroll-runs';

const KPI_HELP =
  'Seller sales bonus amounts included in payroll are scaled at attach: full at ≥70% of plan, half at 50–69%, zero below 50%. Leave both empty to skip KPI for this run.';

function parseOptionalAmount(raw: string): number | null {
  const t = raw.trim();
  if (t === '') return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function moneyStringOrEmpty(v: string | null | undefined): string {
  if (v == null || v === '') return '';
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? String(n) : v;
}

function validateKpiInputs(plan: string, actual: string): string | null {
  const planVal = parseOptionalAmount(plan);
  const actualVal = parseOptionalAmount(actual);
  if (plan.trim() !== '' && planVal === null) {
    return 'Sales plan must be a valid number.';
  }
  if (actual.trim() !== '' && actualVal === null) {
    return 'Sales actual must be a valid number.';
  }
  if (planVal !== null && planVal < 0) {
    return 'Values must be non-negative.';
  }
  if (actualVal !== null && actualVal < 0) {
    return 'Values must be non-negative.';
  }
  return null;
}

export function PayrollRunSalesKpiSection(props: {
  run: PayrollRunDetail;
  onUpdated: (next: PayrollRunDetail) => void;
}) {
  const { run, onUpdated } = props;
  const [plan, setPlan] = useState('');
  const [actual, setActual] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlan(moneyStringOrEmpty(run.kpiSalesPlanAmount));
    setActual(moneyStringOrEmpty(run.kpiSalesActualAmount));
    setError(null);
  }, [run.id, run.kpiSalesPlanAmount, run.kpiSalesActualAmount]);

  const editable =
    (run.status === 'DRAFT' || run.status === 'REVIEW') && run.includedBonusReleaseCount === 0;

  const handleSave = useCallback(async () => {
    if (!editable) return;
    const validationError = validateKpiInputs(plan, actual);
    if (validationError) {
      setError(validationError);
      return;
    }
    const planVal = parseOptionalAmount(plan);
    const actualVal = parseOptionalAmount(actual);
    setSaving(true);
    setError(null);
    try {
      const next = await payrollRunsApi.patch(run.id, {
        kpiSalesPlanAmount: plan.trim() === '' ? null : planVal,
        kpiSalesActualAmount: actual.trim() === '' ? null : actualVal,
      });
      onUpdated(next);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not save sales KPI fields.'));
    } finally {
      setSaving(false);
    }
  }, [actual, editable, onUpdated, plan, run.id]);

  const handleClear = useCallback(async () => {
    if (!editable) return;
    setSaving(true);
    setError(null);
    try {
      const next = await payrollRunsApi.patch(run.id, {
        kpiSalesPlanAmount: null,
        kpiSalesActualAmount: null,
      });
      setPlan('');
      setActual('');
      onUpdated(next);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not clear sales KPI fields.'));
    } finally {
      setSaving(false);
    }
  }, [editable, onUpdated, run.id]);

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Sales KPI (payout gate)</h2>
      <p className="text-muted-foreground mt-1 text-xs">{KPI_HELP}</p>
      {!editable ? (
        <p className="text-muted-foreground mt-2 text-xs">
          {run.status !== 'DRAFT' && run.status !== 'REVIEW'
            ? `Editing is only available in Draft or Review (current: ${run.status}).`
            : `Detach all included bonus releases (${run.includedBonusReleaseCount} attached) to change KPI inputs.`}
        </p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="payroll-kpi-plan">Monthly sales plan</Label>
          <Input
            id="payroll-kpi-plan"
            type="text"
            inputMode="decimal"
            disabled={!editable || saving}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="e.g. 5000000"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payroll-kpi-actual">Sales actual (same month)</Label>
          <Input
            id="payroll-kpi-actual"
            type="text"
            inputMode="decimal"
            disabled={!editable || saving}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="e.g. 3800000"
            autoComplete="off"
          />
          <p className="text-muted-foreground text-xs">
            From payments ({run.payrollMonth}, UTC):{' '}
            <span className="text-foreground font-medium tabular-nums">
              {moneyStringOrEmpty(run.kpiSalesActualSuggestedAmount)}
            </span>
          </p>
        </div>
      </div>
      {error ? <p className="text-destructive mt-2 text-sm">{error}</p> : null}
      {editable ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
            Save KPI inputs
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => {
              setActual(moneyStringOrEmpty(run.kpiSalesActualSuggestedAmount));
              setError(null);
            }}
          >
            Use payment total
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || (plan.trim() === '' && actual.trim() === '')}
            onClick={() => void handleClear()}
          >
            Clear both
          </Button>
        </div>
      ) : null}
    </section>
  );
}
