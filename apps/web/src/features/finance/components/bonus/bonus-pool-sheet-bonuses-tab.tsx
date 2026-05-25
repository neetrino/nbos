'use client';

import { useCallback, useMemo, useState } from 'react';
import { Gift } from 'lucide-react';
import {
  DetailSheetSection,
  EntityItemList,
  ENTITY_ITEM_VIEW_OPTIONS,
  useEntityItemHost,
  ViewModeSwitch,
  type EntityItemSummary,
  type EntityItemVariant,
} from '@/components/shared';
import { BonusPoolEmployeeBreakdown } from '@/features/finance/components/bonus/bonus-pool-employee-breakdown';
import { BonusPoolSheetSuggestedPanel } from '@/features/finance/components/bonus/bonus-pool-sheet-suggested-panel';
import { bonusEntryToItemSummary } from '@/features/finance/entity-item/bonus-entry-item-summary';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type {
  BonusEntryListRow,
  BonusPoolEmployeeLine,
  BonusProductPoolRow,
} from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function MetricRow({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', accentClass)}>{value}</span>
    </div>
  );
}

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
  const { openEntityItem } = useEntityItemHost();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const entryItems = useMemo(() => entries.map(bonusEntryToItemSummary), [entries]);

  const handleOpenItem = useCallback(
    (item: EntityItemSummary) => {
      openEntityItem({ id: item.id, kind: item.kind });
    },
    [openEntityItem],
  );

  return (
    <div className="space-y-5">
      <div className="border-border bg-muted/20 space-y-2 rounded-xl border px-3 py-3">
        <MetricRow label="Planned" value={formatBonusPoolMoney(pool.ledgerPlannedAmount)} />
        <MetricRow
          label="Released"
          value={formatBonusPoolMoney(pool.ledgerReleasedAmount)}
          accentClass="text-teal-700 dark:text-teal-400"
        />
        <MetricRow
          label="Remaining"
          value={formatBonusPoolMoney(pool.ledgerRemainingAmount)}
          accentClass="text-amber-700 dark:text-amber-400"
        />
        <MetricRow
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
          onOpen={handleOpenItem}
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
