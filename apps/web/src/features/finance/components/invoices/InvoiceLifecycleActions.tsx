'use client';

import { useState } from 'react';
import { Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared';
import { invoiceLifecycleAction } from '@/features/finance/utils/invoice-lifecycle';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { toast } from 'sonner';

interface InvoiceLifecycleActionsProps {
  invoice: Invoice;
  disabled?: boolean;
  onInvoiceUpdated: (invoice: Invoice) => void;
  onInvoiceDeleted?: (invoiceId: string) => void;
}

export function InvoiceLifecycleActions({
  invoice,
  disabled = false,
  onInvoiceUpdated,
  onInvoiceDeleted,
}: InvoiceLifecycleActionsProps) {
  const action = invoiceLifecycleAction(invoice);
  const [open, setOpen] = useState(false);
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
        setOpen(false);
        toast.success('Invoice deleted');
      } else {
        const updated = await invoicesApi.cancel(invoice.id);
        onInvoiceUpdated(updated);
        setOpen(false);
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
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10 border-destructive/40"
        disabled={disabled}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {isDelete ? <Trash2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
        {isDelete ? 'Delete invoice' : 'Cancel invoice'}
      </Button>

      <DeleteConfirmDialog
        level="simple"
        open={open}
        onOpenChange={setOpen}
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
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
