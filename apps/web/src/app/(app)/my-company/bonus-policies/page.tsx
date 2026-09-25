'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataView, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { BonusPolicyCard } from '@/features/my-company/bonus-policies/bonus-policy-card';
import { BonusPolicySheet } from '@/features/my-company/bonus-policies/bonus-policy-sheet';
import { bonusPoliciesApi, type BonusPolicyRow } from '@/lib/api/bonus-policies';

const STATUS_RANK: Record<BonusPolicyRow['status'], number> = {
  ACTIVE: 0,
  DRAFT: 1,
  ARCHIVED: 2,
};

function sortPolicies(items: BonusPolicyRow[]): BonusPolicyRow[] {
  return [...items].sort(
    (left, right) =>
      STATUS_RANK[left.status] - STATUS_RANK[right.status] || left.name.localeCompare(right.name),
  );
}

function useBonusPolicyList() {
  const [items, setItems] = useState<BonusPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await bonusPoliciesApi.list();
      setItems(sortPolicies(resp.items));
      setError(null);
    } catch {
      setError('Bonus policies could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replaceSaved = (row: BonusPolicyRow) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === row.id);
      const next = exists ? prev.map((item) => (item.id === row.id ? row : item)) : [...prev, row];
      return sortPolicies(next);
    });
  };

  return { items, loading, error, setError, load, replaceSaved };
}

export default function BonusPoliciesPage() {
  const { items, loading, error, setError, load, replaceSaved } = useBonusPolicyList();
  const [editing, setEditing] = useState<BonusPolicyRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sectionTabs = useCompanySectionTabs('bonus', undefined, 'below');
  const hasData = items.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-3xl text-sm">
          Rules you attach to a salary. Sales percentages live on{' '}
          <Link href="/my-company/sales-bonus-policies" className="text-primary hover:underline">
            Sales rates
          </Link>
          .
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
        emptyFallback={<p className="text-muted-foreground text-sm">No policies yet.</p>}
      >
        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((policy) => (
            <BonusPolicyCard
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
      <BonusPolicySheet
        policy={creating ? null : editing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSaved={replaceSaved}
      />
    </div>
  );
}
