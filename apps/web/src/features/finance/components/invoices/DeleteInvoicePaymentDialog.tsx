'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/shared';

interface DeleteInvoicePaymentDialogProps {
  paymentSummary: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteInvoicePaymentDialog({
  paymentSummary,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteInvoicePaymentDialogProps) {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={paymentSummary}
      title={t('payments.removeTitle')}
      description={t('payments.removeDescription')}
      confirmLabel={t('payments.removeConfirm')}
      dismissLabel={tCommon('cancel')}
      submittingLabel={tCommon('saving')}
      isSubmitting={isSubmitting}
      forceNestedBackdrop
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
