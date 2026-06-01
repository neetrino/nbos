'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import {
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { dealOrderToCreateInvoiceOrder } from '@/features/finance/components/invoices/deal-order-to-create-invoice-order';
import { dealInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import {
  canOpenDealCreateInvoiceDialog,
  canCreateDepositInvoice,
} from '@/features/crm/utils/deal-invoice-eligibility';
import { submitDealInvoiceCreation } from '@/features/crm/utils/submit-deal-invoice-creation';
import type { Deal, DealInvoice } from '@/lib/api/deals';

interface DealInvoiceTabProps {
  deal: Deal;
  onRefresh?: () => void;
  /** Increment (e.g. from parent) to open the create-invoice dialog when the tab is shown. */
  expandCreateFormNonce?: number;
}

export function DealInvoiceTab({
  deal,
  onRefresh,
  expandCreateFormNonce = 0,
}: DealInvoiceTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const taxStatus = deal.taxStatus ?? 'TAX';
  const firstOrder = deal.orders?.[0];
  const createInvoiceOrder = firstOrder ? dealOrderToCreateInvoiceOrder(deal, firstOrder) : null;
  const canCreate = canOpenDealCreateInvoiceDialog(deal, taxStatus);
  const isDepositBootstrap = canCreateDepositInvoice(deal, taxStatus);

  const allInvoices: (DealInvoice & { orderCode: string })[] = (deal.orders ?? []).flatMap(
    (order) => (order.invoices ?? []).map((inv) => ({ ...inv, orderCode: order.code })),
  );

  const itemSummaries = useMemo(() => allInvoices.map(dealInvoiceToItemSummary), [allInvoices]);

  const submitOverride = useCallback(
    async (form: { amount: string; dueDate: string }) => {
      await submitDealInvoiceCreation(deal.id, form, createInvoiceOrder);
    },
    [deal.id, createInvoiceOrder],
  );

  useEffect(() => {
    if (expandCreateFormNonce > 0 && canCreate) {
      setCreateOpen(true);
    }
  }, [expandCreateFormNonce, canCreate]);

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
          onClick={() => setCreateOpen(true)}
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

      {canCreate ? (
        <CreateInvoiceDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          order={createInvoiceOrder}
          submitOverride={submitOverride}
          forceNestedBackdrop
          onCreated={() => {
            onRefresh?.();
          }}
        />
      ) : null}
    </div>
  );
}
