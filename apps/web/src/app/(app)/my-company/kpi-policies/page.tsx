'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataView, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { KpiPolicyCard } from '@/features/my-company/kpi-policies/kpi-policy-card';
import { KpiPolicySheet } from '@/features/my-company/kpi-policies/kpi-policy-sheet';
import { kpiPoliciesApi, type KpiPolicyRow, type KpiPolicyStatus } from '@/lib/api/kpi-policies';

const STATUS_RANK: Record<KpiPolicyStatus, number> = {
  ACTIVE: 0,
  DRAFT: 1,
  ARCHIVED: 2,
};

function sortPolicies(items: KpiPolicyRow[]): KpiPolicyRow[] {
  return [...items].sort(
    (left, right) =>
      STATUS_RANK[left.status] - STATUS_RANK[right.status] || left.name.localeCompare(right.name),
  );
}

export default function KpiPoliciesPage() {
  const [items, setItems] = useState<KpiPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<KpiPolicyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sectionTabs = useCompanySectionTabs('kpi', undefined, 'below');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await kpiPoliciesApi.list();
      setItems(sortPolicies(resp.items));
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

  const replaceSaved = (row: KpiPolicyRow) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === row.id);
      const next = exists ? prev.map((item) => (item.id === row.id ? row : item)) : [...prev, row];
      return sortPolicies(next);
    });
  };

  const hasData = items.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-3xl text-sm">
          Attainment bands that scale a sales bonus. Open a gate to edit the payout steps.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
            setSheetOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          New policy
        </Button>
      </div>
      {error && hasData ? (
        <ListMutationErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
      <DataView
        loading={loading}
        error={error}
        hasData={hasData}
        loadingFallback={<LoadingState variant="cards" count={4} />}
        errorFallback={<ErrorState description={error ?? ''} onRetry={() => void load()} />}
        emptyFallback={<p className="text-muted-foreground text-sm">No KPI gates yet.</p>}
      >
        <ul className="grid w-full grid-cols-2 items-stretch gap-3 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((policy) => (
            <KpiPolicyCard
              key={policy.id}
              policy={policy}
              onOpen={(row) => {
                setCreating(false);
                setEditing(row);
                setSheetOpen(true);
              }}
            />
          ))}
        </ul>
      </DataView>
      <KpiPolicySheet
        policy={creating ? null : editing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={replaceSaved}
      />
    </div>
  );
}
