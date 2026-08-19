'use client';

import { useCallback, useMemo } from 'react';
import { QuickCreateTaskDialog } from '@/components/shared';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { CreateInvoiceDialog } from '@/features/finance/components/invoices/CreateInvoiceDialog';
import { dealOrderToCreateInvoiceOrder } from '@/features/finance/components/invoices/deal-order-to-create-invoice-order';
import { canOpenDealCreateInvoiceDialog } from '@/features/crm/utils/deal-invoice-eligibility';
import { submitDealInvoiceCreation } from '@/features/crm/utils/submit-deal-invoice-creation';
import { buildDealTaskDefaultLinks } from '../utils/crm-entity-task-links';
import type { Deal } from '@/lib/api/deals';

interface DealSheetCreateDialogsProps {
  deal: Deal;
  invoiceCreateOpen: boolean;
  onInvoiceCreateOpenChange: (open: boolean) => void;
  taskCreateOpen: boolean;
  onTaskCreateOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  onTaskCreated?: () => void;
}

/** Parent-owned create dialogs shared by tab +, Actions menu, and in-tab Create buttons. */
export function DealSheetCreateDialogs({
  deal,
  invoiceCreateOpen,
  onInvoiceCreateOpenChange,
  taskCreateOpen,
  onTaskCreateOpenChange,
  onRefresh,
  onTaskCreated,
}: DealSheetCreateDialogsProps) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const firstOrder = deal.orders?.[0];
  const projectId = deal.projectId ?? firstOrder?.projectId;
  const taxStatus = deal.taxStatus ?? 'TAX';
  const createInvoiceOrder = firstOrder ? dealOrderToCreateInvoiceOrder(deal, firstOrder) : null;
  const canCreateInvoice = canOpenDealCreateInvoiceDialog(deal, taxStatus);

  const defaultLinks = useMemo(
    () => buildDealTaskDefaultLinks(deal.id, projectId),
    [deal.id, projectId],
  );

  const submitOverride = useCallback(
    async (form: { amount: string; dueDate: string }) => {
      await submitDealInvoiceCreation(deal.id, form, createInvoiceOrder);
    },
    [deal.id, createInvoiceOrder],
  );

  return (
    <>
      {canCreateInvoice ? (
        <CreateInvoiceDialog
          open={invoiceCreateOpen}
          onOpenChange={onInvoiceCreateOpenChange}
          order={createInvoiceOrder}
          submitOverride={submitOverride}
          forceNestedBackdrop
          onCreated={() => {
            onRefresh?.();
          }}
        />
      ) : null}
      <QuickCreateTaskDialog
        open={taskCreateOpen}
        onOpenChange={onTaskCreateOpenChange}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLinks={defaultLinks}
        forceNestedBackdrop
        onCreated={() => {
          onTaskCreated?.();
          onRefresh?.();
        }}
      />
    </>
  );
}
