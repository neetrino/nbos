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
import { OPEN_INVOICE_QUERY } from '@/features/finance/constants/invoice-deep-link';
import { clientServiceInvoiceLinkToItemSummary } from '@/features/finance/entity-item/client-service-finance-item-summary';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';

interface ClientServiceInvoicesTabProps {
  links: ClientServiceFinanceLinks | undefined;
  canCreateInvoice: boolean;
  creating: boolean;
  onCreate: () => void;
}

export function ClientServiceInvoicesTab({
  links,
  canCreateInvoice,
  creating,
  onCreate,
}: ClientServiceInvoicesTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');
  const invoices = links?.invoices ?? [];

  const itemSummaries = useMemo(
    () => invoices.map((row) => clientServiceInvoiceLinkToItemSummary(row)),
    [invoices],
  );

  return (
    <DetailSheetSection title="Invoice cards" icon={<FileText size={12} />}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {canCreateInvoice ? (
          <Button type="button" size="sm" disabled={creating} onClick={onCreate}>
            <Plus size={14} aria-hidden />
            Create invoice
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">
            Company-paid services do not use invoices.
          </p>
        )}
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
        emptyDescription="No invoice cards linked to this service yet."
      />

      {invoices.length > 0 ? (
        <Link
          href={`/finance/invoices?${OPEN_INVOICE_QUERY}=${encodeURIComponent(invoices[0].id)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
        >
          <FileText size={14} aria-hidden />
          Open in Finance
          <ExternalLink size={12} className="opacity-70" aria-hidden />
        </Link>
      ) : null}
    </DetailSheetSection>
  );
}
