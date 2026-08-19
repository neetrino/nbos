'use client';

import { useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import {
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { dealInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import {
  canOpenDealCreateInvoiceDialog,
  canCreateDepositInvoice,
} from '@/features/crm/utils/deal-invoice-eligibility';
import type { Deal } from '@/lib/api/deals';

interface DealInvoiceTabProps {
  deal: Deal;
  onCreateOpenChange: (open: boolean) => void;
}

export function DealInvoiceTab({ deal, onCreateOpenChange }: DealInvoiceTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const taxStatus = deal.taxStatus ?? 'TAX';
  const canCreate = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const isDepositBootstrap = canCreateDepositInvoice(deal, taxStatus);

  const allInvoices = (deal.orders ?? []).flatMap((order) =>
    (order.invoices ?? []).map((inv) => ({ ...inv, order })),
  );

  const itemSummaries = useMemo(
    () =>
      allInvoices.map((inv) =>
        dealInvoiceToItemSummary(inv, {
          code: inv.order.code,
          deal: { name: deal.name, code: deal.code },
        }),
      ),
    [allInvoices, deal.code, deal.name],
  );

  const emptyDescription = canCreate
    ? isDepositBootstrap
      ? 'No invoices yet. Create a deposit invoice to start billing.'
      : 'No invoices yet. Create one to track payments.'
    : 'Fill deal finance fields on General, then create a deposit invoice from Actions.';

  return (
    <div className="space-y-4">
      {canCreate ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
          onClick={() => onCreateOpenChange(true)}
        >
          <Plus size={14} />
          Create Invoice
        </Button>
      ) : null}

      {allInvoices.length > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ViewModeSwitch
            value={viewVariant}
            onChange={setViewVariant}
            options={ENTITY_ITEM_VIEW_OPTIONS}
            ariaLabel="Invoice list view"
          />
        </div>
      ) : null}

      <EntityItemList
        items={itemSummaries}
        variant={viewVariant}
        onOpen={onOpenItem}
        emptyIcon={FileText}
        emptyTitle="Invoices"
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
