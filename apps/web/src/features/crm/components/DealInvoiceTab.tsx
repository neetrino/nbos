'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EntityItemList,
  useOpenEntityItemFromSummary,
  ViewModeSwitch,
  ENTITY_ITEM_VIEW_OPTIONS,
  type EntityItemVariant,
} from '@/components/shared';
import { dealInvoiceToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import { invoicesApi } from '@/lib/api/finance';
import type { Deal, DealInvoice } from '@/lib/api/deals';

interface DealInvoiceTabProps {
  deal: Deal;
  onRefresh?: () => void;
  /** Increment (e.g. from parent) to open the create-invoice form when the tab is shown. */
  expandCreateFormNonce?: number;
}

export function DealInvoiceTab({
  deal,
  onRefresh,
  expandCreateFormNonce = 0,
}: DealInvoiceTabProps) {
  const onOpenItem = useOpenEntityItemFromSummary();
  const [showForm, setShowForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewVariant, setViewVariant] = useState<EntityItemVariant>('list-row');

  const allInvoices: (DealInvoice & { orderCode: string })[] = (deal.orders ?? []).flatMap(
    (order) => (order.invoices ?? []).map((inv) => ({ ...inv, orderCode: order.code })),
  );

  const itemSummaries = useMemo(() => allInvoices.map(dealInvoiceToItemSummary), [allInvoices]);

  const firstOrder = deal.orders?.[0];

  useEffect(() => {
    if (expandCreateFormNonce > 0 && firstOrder) {
      setShowForm(true);
    }
  }, [expandCreateFormNonce, firstOrder]);

  const handleCreate = async () => {
    const amount = Number(invoiceAmount);
    if (!amount || amount <= 0 || !firstOrder) return;

    setCreating(true);
    try {
      const taxStatus = deal.taxStatus ?? 'TAX';
      await invoicesApi.create({
        orderId: firstOrder.id,
        projectId: firstOrder.projectId,
        amount,
        type: deal.paymentType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'DEVELOPMENT',
        ...(taxStatus === 'TAX' && deal.companyId && { companyId: deal.companyId }),
      });
      setShowForm(false);
      setInvoiceAmount('');
      onRefresh?.();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {firstOrder ? (
        <div>
          {showForm ? (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex-1">
                <label className="text-muted-foreground mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                  Invoice Amount (AMD)
                </label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="text-foreground w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 dark:border-stone-700 dark:bg-stone-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') setShowForm(false);
                  }}
                />
              </div>
              <div className="flex gap-1.5 pt-5">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !invoiceAmount || Number(invoiceAmount) <= 0}
                  className="gap-1"
                >
                  <Check size={14} />
                  Create
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setInvoiceAmount('');
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} />
              Create Invoice
            </Button>
          )}
        </div>
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
        emptyDescription={
          firstOrder
            ? 'No invoices yet. Create one to track payments.'
            : 'Create an order first to start invoicing.'
        }
      />
    </div>
  );
}
