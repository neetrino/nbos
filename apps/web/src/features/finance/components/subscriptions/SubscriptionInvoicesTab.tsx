'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DetailSheetSection,
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { subscriptionInvoicesDrilldownHref } from '@/features/finance/constants/subscription-invoice-drilldown';
import { subscriptionInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import { cn } from '@/lib/utils';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionInvoicesTabProps {
  subscription: Subscription;
  canCreateInvoice: boolean;
  onCreateInvoice: () => void;
}

export function SubscriptionInvoicesTab({
  subscription,
  canCreateInvoice,
  onCreateInvoice,
}: SubscriptionInvoicesTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const invoices = useMemo(() => subscription.invoices ?? [], [subscription.invoices]);

  const itemSummaries = useMemo(
    () =>
      invoices.map((row) =>
        subscriptionInvoiceToItemSummary(row, {
          name: subscription.name,
          code: subscription.code,
        }),
      ),
    [invoices, subscription.code, subscription.name],
  );

  return (
    <DetailSheetSection
      title="Invoices"
      icon={<FileText size={12} />}
      titleTrailing={
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {canCreateInvoice ? (
            <Button type="button" size="sm" onClick={onCreateInvoice}>
              <Plus size={14} aria-hidden />
              Create Invoice
            </Button>
          ) : null}
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel="Invoice list view"
          />
        </div>
      }
      titleRowClassName="flex-nowrap"
    >
      <EntityItemList
        items={itemSummaries}
        variant={viewVariant}
        onOpen={onOpenItem}
        emptyIcon={FileText}
        emptyTitle="No invoices"
        emptyDescription={
          canCreateInvoice
            ? 'Create an invoice for an unpaid coverage month.'
            : 'No invoices linked to this subscription yet.'
        }
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
