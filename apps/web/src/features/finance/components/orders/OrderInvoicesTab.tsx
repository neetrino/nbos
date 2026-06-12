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
import { invoicePreviewToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/api/finance';

interface OrderInvoicesTabProps {
  order: Order;
  onCreateInvoice: () => void;
}

export function OrderInvoicesTab({ order, onCreateInvoice }: OrderInvoicesTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const invoices = useMemo(() => order.invoices ?? [], [order.invoices]);

  const itemSummaries = useMemo(
    () => invoices.map((row) => invoicePreviewToItemSummary(row)),
    [invoices],
  );

  return (
    <DetailSheetSection title="Invoices" icon={<FileText size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" onClick={onCreateInvoice}>
          <Plus size={14} aria-hidden />
          Create Invoice
        </Button>
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
        onOpen={onOpenItem}
        emptyIcon={FileText}
        emptyTitle="No invoices"
        emptyDescription="No invoices linked to this order yet."
      />

      {invoices.length > 0 ? (
        <Link
          href={`/finance/invoices?search=${encodeURIComponent(order.code)}`}
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
