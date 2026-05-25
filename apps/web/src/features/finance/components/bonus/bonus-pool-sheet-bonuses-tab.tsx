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
import { BonusPoolSheetSuggestedPanel } from '@/features/finance/components/bonus/bonus-pool-sheet-suggested-panel';
import { bonusEntryToItemSummary } from '@/features/finance/entity-item/bonus-entry-item-summary';
import type {
  BonusEntryListRow,
  BonusPoolEmployeeLine,
  BonusProductPoolRow,
} from '@/lib/api/bonus';

export function BonusPoolSheetBonusesTab({
  pool,
  lines,
  entries,
  entriesError,
  onAfterAutoRelease,
}: {
  pool: BonusProductPoolRow;
  lines: BonusPoolEmployeeLine[];
  entries: BonusEntryListRow[];
  entriesError: string | null;
  onAfterAutoRelease: () => void | Promise<void>;
}) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const entryItems = useMemo(() => entries.map(bonusEntryToItemSummary), [entries]);

  return (
    <div className="space-y-5">
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
    </div>
  );
}
