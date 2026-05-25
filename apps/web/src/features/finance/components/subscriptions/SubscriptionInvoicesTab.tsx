'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useEntityItemHost,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemSummary,
  type EntityItemVariant,
} from '@/components/shared';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { subscriptionInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionInvoicesTabProps {
  subscription: Subscription;
}

export function SubscriptionInvoicesTab({ subscription }: SubscriptionInvoicesTabProps) {
  const { openEntityItem } = useEntityItemHost();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const invoices = subscription.invoices ?? [];

  const itemSummaries = useMemo(() => invoices.map(subscriptionInvoiceToItemSummary), [invoices]);

  const handleOpenItem = useCallback(
    (item: EntityItemSummary) => {
      openEntityItem({ id: item.id, kind: item.kind });
    },
    [openEntityItem],
  );

  return (
    <DetailSheetSection title="Invoices" icon={<FileText size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <ViewModeSwitch
          value={viewVariant}
          onChange={setViewVariant}
          options={ENTITY_ITEM_VIEW_OPTIONS}
          ariaLabel="Invoice list view"
        />
      </div>

      <EntityItemList
        items={itemSummaries}
        variant={viewVariant}
        onOpen={handleOpenItem}
        emptyIcon={FileText}
        emptyTitle="No invoices"
        emptyDescription="No invoices linked to this subscription yet."
      />

      {invoices.length > 0 ? (
        <Link
          href={subscriptionInvoicesDrilldownHref(subscription.id)}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <FileText size={14} aria-hidden />
          Open all in Finance
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
