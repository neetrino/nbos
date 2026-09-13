'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/shared';
import { invoiceLifecycleAction } from '@/features/finance/utils/invoice-lifecycle';
import { getInvoiceDisplayTitle } from '@/features/finance/utils/order-display';
import { getApiErrorMessage } from '@/lib/api-errors';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { toast } from 'sonner';

interface InvoiceLifecycleConfirmDialogProps {
  invoice: Invoice;
  isPlatformOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: (invoice: Invoice) => void;
  onInvoiceDeleted?: (invoiceId: string) => void;
  forceNestedBackdrop?: boolean;
}

export function InvoiceLifecycleConfirmDialog({
  invoice,
  isPlatformOwner,
  open,
  onOpenChange,
  onInvoiceUpdated,
  onInvoiceDeleted,
  forceNestedBackdrop,
}: InvoiceLifecycleConfirmDialogProps) {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
  const action = invoiceLifecycleAction(invoice, isPlatformOwner);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  const isDelete = action === 'delete';
  const displayTitle = getInvoiceDisplayTitle(invoice);
  const itemName =
    displayTitle === invoice.code ? invoice.code : `${displayTitle} (${invoice.code})`;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (isDelete) {
        await invoicesApi.delete(invoice.id);
        onInvoiceDeleted?.(invoice.id);
        onOpenChange(false);
        toast.success(t('lifecycle.deleted'));
      } else {
        const updated = await invoicesApi.cancel(invoice.id);
        onInvoiceUpdated(updated);
        onOpenChange(false);
        toast.success(t('lifecycle.cancelled'));
      }
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          isDelete ? t('lifecycle.deleteFailed') : t('lifecycle.cancelFailed'),
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
      itemName={itemName}
      title={isDelete ? t('lifecycle.deleteTitle') : t('lifecycle.cancelTitle')}
      description={isDelete ? t('lifecycle.deleteDescription') : t('lifecycle.cancelDescription')}
      confirmLabel={isDelete ? t('lifecycle.deleteConfirm') : t('sheet.cancelInvoice')}
      dismissLabel={tCommon('cancel')}
      submittingLabel={tCommon('saving')}
      isSubmitting={submitting}
      errorMessage={error}
      forceNestedBackdrop={forceNestedBackdrop}
      onConfirm={() => void handleConfirm()}
    />
  );
}
