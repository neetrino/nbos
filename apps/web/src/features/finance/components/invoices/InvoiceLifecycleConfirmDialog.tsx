'use client';

import { useState } from 'react';
import { DeleteConfirmDialog } from '@/components/shared';
import { invoiceLifecycleAction } from '@/features/finance/utils/invoice-lifecycle';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { toast } from 'sonner';

interface InvoiceLifecycleConfirmDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: (invoice: Invoice) => void;
  onInvoiceDeleted?: (invoiceId: string) => void;
  forceNestedBackdrop?: boolean;
}

export function InvoiceLifecycleConfirmDialog({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
  onInvoiceDeleted,
  forceNestedBackdrop,
}: InvoiceLifecycleConfirmDialogProps) {
  const action = invoiceLifecycleAction(invoice);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  const isDelete = action === 'delete';

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (isDelete) {
        await invoicesApi.delete(invoice.id);
        onInvoiceDeleted?.(invoice.id);
        onOpenChange(false);
        toast.success('Invoice deleted');
      } else {
        const updated = await invoicesApi.cancel(invoice.id);
        onInvoiceUpdated(updated);
        onOpenChange(false);
        toast.success('Invoice cancelled');
      }
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          isDelete ? 'Invoice could not be deleted.' : 'Invoice could not be cancelled.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError(null);
      }}
      itemName={invoice.code}
      title={isDelete ? 'Delete draft invoice?' : 'Cancel invoice?'}
      description={
        isDelete
          ? 'Only NEW invoices without payments can be deleted. Accrual journal line will be reversed.'
          : 'The invoice will move to Cancelled and stay in history. Payments are preserved.'
      }
      confirmLabel={isDelete ? 'Delete' : 'Cancel invoice'}
      isSubmitting={submitting}
      errorMessage={error}
      forceNestedBackdrop={forceNestedBackdrop}
      onConfirm={() => void handleConfirm()}
    />
  );
}
