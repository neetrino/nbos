'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHero } from '@/components/shared';
import { KpiPolicyEditorCard } from '@/features/my-company/kpi-policies/kpi-policy-editor-card';
import {
  DEFAULT_GATE_BAND_DRAFTS,
  parseDraftsToRules,
} from '@/features/my-company/kpi-policies/kpi-gate-band-utils';
import { KpiGateBandEditor } from '@/features/my-company/kpi-policies/kpi-gate-band-editor';
import { kpiPoliciesApi, type KpiPolicyRow, type KpiPolicyStatus } from '@/lib/api/kpi-policies';

export default function KpiPoliciesPage() {
  const [items, setItems] = useState<KpiPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBands, setNewBands] = useState(DEFAULT_GATE_BAND_DRAFTS);

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
    if (gateRules == null || newName.trim().length < 2) {
      setError('Enter a policy name and valid bands before creating.');
      return;
    }
    setCreating(true);
    try {
      const created = await kpiPoliciesApi.create({
        name: newName.trim(),
        gateRules,
        scope: 'COMPANY',
      });
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewBands(DEFAULT_GATE_BAND_DRAFTS);
      setError(null);
    } catch {
      setError('Could not create policy.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="KPI gate policies"
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void load()}
          >
            Refresh
          </Button>
        }
      />
      <p className="text-muted-foreground text-sm">
        Payout multipliers by plan attainment %. Assign a policy on each employee compensation
        profile; payroll attach uses it for SALES bonus releases (template logic stays in the
        platform).
      </p>

      {loading ? (
        <LoadingState variant="cards" count={2} />
      ) : error && items.length === 0 ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : (
        <>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="border-border bg-card rounded-2xl border p-4">
            <h2 className="text-foreground mb-3 text-sm font-semibold">New policy</h2>
            <label className="mb-3 block space-y-1 text-sm">
              <span className="text-muted-foreground">Name</span>
              <Input
                value={newName}
                disabled={creating}
                placeholder="e.g. Seller KPI gate Q2"
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <KpiGateBandEditor bands={newBands} onChange={setNewBands} disabled={creating} />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={creating}
                onClick={() => void handleCreate()}
              >
                {creating ? 'Creating…' : 'Create policy'}
              </Button>
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
      )}
    </div>
  );
}
