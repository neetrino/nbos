'use client';

import { useMemo, useState } from 'react';
import { Gift } from 'lucide-react';
import {
  DetailSheetSection,
  EntityItemList,
  ENTITY_ITEM_VIEW_OPTIONS,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  type EntityItemVariant,
} from '@/components/shared';
import { BonusPoolEmployeeBreakdown } from '@/features/finance/components/bonus/bonus-pool-employee-breakdown';
import { BonusPoolSheetMetricRow } from '@/features/finance/components/bonus/bonus-pool-sheet-metric-row';
import { BonusPoolSheetSuggestedPanel } from '@/features/finance/components/bonus/bonus-pool-sheet-suggested-panel';
import { bonusEntryToItemSummary } from '@/features/finance/entity-item/bonus-entry-item-summary';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type {
  BonusEntryListRow,
  BonusPoolEmployeeLine,
  BonusProductPoolRow,
} from '@/lib/api/bonus';

export function BonusPoolSheetBonusesTab({
  pool,
  lines,
  entries,
  loading,
  linesError,
  entriesError,
  onAfterAutoRelease,
}: {
  pool: BonusProductPoolRow;
  lines: BonusPoolEmployeeLine[];
  entries: BonusEntryListRow[];
  loading: boolean;
  linesError: string | null;
  entriesError: string | null;
  onAfterAutoRelease: () => void | Promise<void>;
}) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const entryItems = useMemo(() => entries.map(bonusEntryToItemSummary), [entries]);

  return (
    <div className="space-y-5">
      <div className="border-border bg-muted/20 space-y-2 rounded-xl border px-3 py-3">
        <BonusPoolSheetMetricRow
          label="Planned"
          value={formatBonusPoolMoney(pool.ledgerPlannedAmount)}
        />
        <BonusPoolSheetMetricRow
          label="Released"
          value={formatBonusPoolMoney(pool.ledgerReleasedAmount)}
          accentClass="text-teal-700 dark:text-teal-400"
        />
        <BonusPoolSheetMetricRow
          label="Remaining"
          value={formatBonusPoolMoney(pool.ledgerRemainingAmount)}
          accentClass="text-amber-700 dark:text-amber-400"
        />
        <BonusPoolSheetMetricRow
          label="Paid"
          value={formatBonusPoolMoney(pool.sumPaidAmount)}
          accentClass="text-emerald-700 dark:text-emerald-400"
        />
      </div>

      <DetailSheetSection title="Suggested release">
        <BonusPoolSheetSuggestedPanel
          pool={pool}
          lines={lines}
          onAfterAutoRelease={onAfterAutoRelease}
        />
      </DetailSheetSection>

      <DetailSheetSection title="Bonus entries" icon={<Gift size={12} aria-hidden />}>
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel="Bonus entry list view"
          />
        </div>
        {entriesError ? <p className="text-destructive mb-3 text-sm">{entriesError}</p> : null}
        <EntityItemList
          items={entryItems}
          variant={viewVariant}
          onOpen={onOpenItem}
          emptyIcon={Gift}
          emptyTitle="No bonus entries"
          emptyDescription="Bonus lines for this product pool appear here."
        />
      </DetailSheetSection>

      <DetailSheetSection title="By employee">
        <p className="text-muted-foreground mb-3 text-xs">
          Aggregated planned, released, and paid totals per person.
        </p>
        <BonusPoolEmployeeBreakdown lines={lines} loading={loading} error={linesError} />
      </DetailSheetSection>
    </div>
  );
}
