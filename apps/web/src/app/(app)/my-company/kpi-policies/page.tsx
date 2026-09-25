'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DataView,
  ErrorState,
  InlineField,
  ListMutationErrorBanner,
  LoadingState,
} from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { KpiPolicyEditorCard } from '@/features/my-company/kpi-policies/kpi-policy-editor-card';
import {
  DEFAULT_GATE_BAND_DRAFTS,
  parseDraftsToRules,
} from '@/features/my-company/kpi-policies/kpi-gate-band-utils';
import { KpiGateBandEditor } from '@/features/my-company/kpi-policies/kpi-gate-band-editor';
import {
  KpiPolicyCapField,
  parseCapMultiplierDraft,
} from '@/features/my-company/kpi-policies/kpi-policy-cap-field';
import { KPI_POLICY_CAP_MULTIPLIER_DEFAULT } from '@/features/my-company/kpi-policies/kpi-policy-cap.constants';
import { DEFAULT_SALES_SCORECARD_METRICS } from '@/features/my-company/kpi-policies/kpi-scorecard-metrics.types';
import {
  KpiPolicyTargetField,
  parseTargetAmountDraft,
} from '@/features/my-company/kpi-policies/kpi-policy-target-field';
import { kpiPoliciesApi, type KpiPolicyRow, type KpiPolicyStatus } from '@/lib/api/kpi-policies';

export default function KpiPoliciesPage() {
  const [items, setItems] = useState<KpiPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBands, setNewBands] = useState(DEFAULT_GATE_BAND_DRAFTS);
  const [newCapMultiplier, setNewCapMultiplier] = useState(
    String(KPI_POLICY_CAP_MULTIPLIER_DEFAULT),
  );
  const [newTargetAmount, setNewTargetAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await kpiPoliciesApi.list();
      setItems(resp.items);
      setError(null);
    } catch {
      setError('KPI policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (
    id: string,
    payload: {
      name: string;
      gateRules: KpiPolicyRow['gateRules'];
      status: KpiPolicyStatus;
      targetAmount: number | null;
      targetSource: string;
      resultSource: string;
      bonusCapBaseSalaryMultiplier: number;
    },
  ) => {
    setSavingId(id);
    try {
      const updated = await kpiPoliciesApi.update(id, payload);
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setError(null);
    } catch {
      setError('Save failed. Check bands (0–100) and try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    const gateRules = parseDraftsToRules(newBands);
    const cap = parseCapMultiplierDraft(newCapMultiplier);
    const targetAmount = parseTargetAmountDraft(newTargetAmount);
    if (gateRules == null || cap == null || newName.trim().length < 2) {
      setError('Enter a policy name, valid cap (1–3), and valid bands before creating.');
      return;
    }
    setCreating(true);
    try {
      const created = await kpiPoliciesApi.create({
        name: newName.trim(),
        gateRules,
        scorecardMetrics: DEFAULT_SALES_SCORECARD_METRICS,
        targetAmount,
        targetSource: 'MANUAL_POLICY',
        resultSource: 'SALES_PAYMENTS',
        bonusCapBaseSalaryMultiplier: cap,
        scope: 'COMPANY',
      });
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewBands(DEFAULT_GATE_BAND_DRAFTS);
      setNewTargetAmount('');
      setError(null);
    } catch {
      setError('Could not create policy.');
    } finally {
      setCreating(false);
    }
  };

  const hasData = items.length > 0;
  const content = (
    <>
      <div className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
        <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
        <div className="relative mb-3 flex items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Target size={15} />
          </div>
          <h2 className="text-foreground text-sm font-semibold">New policy</h2>
        </div>
        <div className="relative">
          <InlineField
            variant="controlled"
            label="Name"
            value={newName}
            placeholder="Seller KPI gate Q2"
            disabled={creating}
            onValueChange={setNewName}
            className="mb-3"
          />
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <KpiPolicyCapField
              value={newCapMultiplier}
              disabled={creating}
              onChange={setNewCapMultiplier}
            />
            <KpiPolicyTargetField
              value={newTargetAmount}
              disabled={creating}
              onChange={setNewTargetAmount}
            />
          </div>
          <KpiGateBandEditor bands={newBands} onChange={setNewBands} disabled={creating} />
          <div className="mt-4 flex justify-end">
            <Button type="button" size="sm" disabled={creating} onClick={() => void handleCreate()}>
              {creating ? 'Creating…' : 'Create policy'}
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((policy) => (
          <KpiPolicyEditorCard
            key={policy.id}
            policy={policy}
            saving={savingId === policy.id}
            onSave={handleSave}
          />
        ))}
      </div>
    </>
  );

  const refresh = useMemo(
    () => (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void load()}
      >
        Refresh
      </Button>
    ),
    [loading, load],
  );
  useCompanySectionTabs('kpi', refresh);

  return (
    <div className="flex flex-col gap-4">
      {error && hasData ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasData}
        loadingFallback={<LoadingState variant="cards" count={2} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={content}
      >
        {content}
      </DataView>
    </div>
  );
}
