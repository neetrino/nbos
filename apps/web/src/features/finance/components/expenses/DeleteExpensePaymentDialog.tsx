'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/shared';

interface DeleteExpensePaymentDialogProps {
  paymentSummary: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteExpensePaymentDialog({
  paymentSummary,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteExpensePaymentDialogProps) {
  const t = useTranslations('expenses');
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={paymentSummary}
      title={t('dialogs.removePaymentTitle')}
      description={t('dialogs.removePaymentDescription')}
      confirmLabel={t('dialogs.removePaymentConfirm')}
      isSubmitting={isSubmitting}
      forceNestedBackdrop
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
