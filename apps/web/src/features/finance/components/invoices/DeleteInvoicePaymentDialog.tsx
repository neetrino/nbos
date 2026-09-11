'use client';

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
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={paymentSummary}
      title="Remove payment?"
      description="This payment will be removed from the invoice. Money status will recalculate from remaining payments, and you can record the payment again later."
      confirmLabel="Remove"
      isSubmitting={isSubmitting}
      forceNestedBackdrop
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
