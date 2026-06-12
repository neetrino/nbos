'use client';

import { DeleteConfirmDialog } from '@/components/shared';

export type ExpenseLifecycleDialogMode = 'delete' | 'cancel';

interface DeleteExpenseDialogProps {
  expenseName: string;
  mode: ExpenseLifecycleDialogMode;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

const COPY: Record<
  ExpenseLifecycleDialogMode,
  { title: string; description: string; confirmLabel: string }
> = {
  delete: {
    title: 'Delete expense?',
    description: 'This draft expense will be removed. Use only for mistaken PLANNED cards.',
    confirmLabel: 'Delete',
  },
  cancel: {
    title: 'Cancel expense?',
    description:
      'The expense will move to Cancelled and stay in history. Payments and journal lines are preserved.',
    confirmLabel: 'Cancel expense',
  },
};

export function DeleteExpenseDialog({
  expenseName,
  mode,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: DeleteExpenseDialogProps) {
  const copy = COPY[mode];
  return (
    <DeleteConfirmDialog
      level="simple"
      open={open}
      onOpenChange={onOpenChange}
      itemName={expenseName}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
