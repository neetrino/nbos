'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Banknote, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  ENTITY_ITEM_VIEW_OPTIONS,
  useEntityItemHost,
  ViewModeSwitch,
  type EntityItemSummary,
  type EntityItemVariant,
} from '@/components/shared';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import {
  bonusPoolPaymentToItemSummary,
  bonusPoolReleaseToItemSummary,
} from '@/features/finance/entity-item/bonus-pool-funding-item-summary';
import type { BonusPoolTimelineEvent, BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function BonusPoolSheetFundingTab({
  pool,
  timelineEvents,
  loading,
  error,
}: {
  pool: BonusProductPoolRow;
  timelineEvents: BonusPoolTimelineEvent[];
  loading: boolean;
  error: string | null;
}) {
  const { openEntityItem } = useEntityItemHost();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const paymentItems = useMemo(
    () =>
      timelineEvents
        .filter((event) => event.kind === 'PAYMENT_IN')
        .map(bonusPoolPaymentToItemSummary)
        .filter((item): item is EntityItemSummary => item != null),
    [timelineEvents],
  );

  const releaseItems = useMemo(
    () =>
      timelineEvents
        .filter((event) => event.kind === 'RELEASE_OUT')
        .map(bonusPoolReleaseToItemSummary)
        .filter((item): item is EntityItemSummary => item != null),
    [timelineEvents],
  );

  const handleOpenItem = useCallback(
    (item: EntityItemSummary) => {
      openEntityItem({ id: item.id, kind: item.kind });
    },
    [openEntityItem],
  );

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading funding detail…</p>;
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="border-border bg-muted/20 space-y-2 rounded-xl border px-3 py-3">
        <MetricRow
          label="Received from client"
          value={formatBonusPoolMoney(pool.ledgerReceivedAmount)}
        />
        <MetricRow
          label="Available for release"
          value={formatBonusPoolMoney(pool.ledgerAvailableFunding)}
        />
        <MetricRow
          label="Over funding"
          value={formatBonusPoolMoney(pool.ledgerOverFundingAmount)}
        />
      </div>

      <DetailSheetSection title="Client payments" icon={<Banknote size={12} aria-hidden />}>
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel="Payment list view"
          />
        </div>
        <EntityItemList
          items={paymentItems}
          variant={viewVariant}
          onOpen={handleOpenItem}
          emptyIcon={Banknote}
          emptyTitle="No client payments"
          emptyDescription="Payments on linked order invoices will fill this pool."
        />
      </DetailSheetSection>

      <DetailSheetSection title="Bonus releases out">
        <EntityItemList
          items={releaseItems}
          variant={viewVariant}
          onOpen={handleOpenItem}
          emptyIcon={Banknote}
          emptyTitle="No releases yet"
          emptyDescription="Approved releases reduce available pool funding."
        />
      </DetailSheetSection>

      <Link
        href={`/finance/payments?projectId=${pool.projectId}`}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
      >
        Open payments in Finance
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </div>
  );
}
