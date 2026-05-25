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
import { bonusPoolPaymentToItemSummary } from '@/features/finance/entity-item/bonus-pool-funding-item-summary';
import type { BonusPoolTimelineEvent, BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

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

  const paymentEvents = useMemo(
    () => timelineEvents.filter((event) => event.kind === 'PAYMENT_IN'),
    [timelineEvents],
  );

  const paymentItems = useMemo(
    () =>
      paymentEvents
        .map(bonusPoolPaymentToItemSummary)
        .filter((item): item is EntityItemSummary => item != null),
    [paymentEvents],
  );

  const handleOpenItem = useCallback(
    (item: EntityItemSummary) => {
      const event = paymentEvents.find((row) => row.invoiceId === item.id || row.id === item.id);
      if (event?.invoiceId) {
        openEntityItem({ id: event.invoiceId, kind: 'invoice' });
      }
    },
    [openEntityItem, paymentEvents],
  );

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading client payments…</p>;
  }
  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  const received = formatBonusPoolMoney(pool.ledgerReceivedAmount);
  const emptyDescription =
    received !== '—' && received !== '0.00'
      ? 'Received total is on the ledger, but no payment rows are linked to order invoices yet.'
      : 'Payments on linked order invoices will fill this pool.';

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Client payments received for this product pool through order invoices.
      </p>

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
          emptyDescription={emptyDescription}
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
