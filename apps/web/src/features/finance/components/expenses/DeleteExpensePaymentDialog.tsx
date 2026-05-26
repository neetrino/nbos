'use client';

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
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={paymentSummary}
      title="Remove payment?"
      description="This payment line will be removed from the expense. You can record it again later."
      confirmLabel="Remove"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
