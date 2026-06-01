'use client';

import { DeleteConfirmDialog } from '@/components/shared';

interface DeleteExpenseDialogProps {
  expenseName: string;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteExpenseDialog({
  expenseName,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteExpenseDialogProps) {
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={expenseName}
      title="Delete expense?"
      description="The expense and its payment history will be removed from Finance."
      confirmLabel="Delete"
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
