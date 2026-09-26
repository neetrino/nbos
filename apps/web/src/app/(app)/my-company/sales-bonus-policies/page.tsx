'use client';

import { useCallback, useEffect, useState } from 'react';
import { DataView, ErrorState, ListMutationErrorBanner, LoadingState } from '@/components/shared';
import { useCompanySectionTabs } from '@/features/hr/components/use-company-section-tabs';
import { bonusesApi, type SalesBonusPolicyRow } from '@/lib/api/bonus';
import { SalesBonusPolicyBoard, type RowDraft } from './sales-bonus-policy-board';

function parsePercentInput(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

export default function SalesBonusPoliciesPage() {
  const [rows, setRows] = useState<SalesBonusPolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bonusesApi.getSalesPolicies();
      setRows(data);
      setError(null);
    } catch {
      setError('Sales bonus policies could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRow = async (row: SalesBonusPolicyRow, draft: RowDraft) => {
    const seller = parsePercentInput(draft.sellerPercent);
    const assistant = parsePercentInput(draft.assistantPercent);
    if (seller === null || seller < 0 || seller > 100) return;
    if (assistant === null || assistant < 0 || assistant > 100) return;

    setSavingId(row.id);
    try {
      const updated = await bonusesApi.patchSalesPolicy(row.id, {
        sellerPercent: seller,
        assistantPercent: assistant,
        isActive: draft.isActive,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError('Save failed. Try again or refresh the page.');
    } finally {
      setSavingId(null);
    }
  };

  const hasData = rows.length > 0;
  const content = (
    <SalesBonusPolicyBoard
      rows={rows}
      savingId={savingId}
      onSave={(row, draft) => void saveRow(row, draft)}
    />
  );

  const sectionTabs = useCompanySectionTabs('bonus', undefined, 'below');

  return (
    <div className="flex flex-col gap-4">
      {sectionTabs}
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
