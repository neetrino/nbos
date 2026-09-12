'use client';

import { useTranslations } from 'next-intl';
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
  /** Use when opened inside an entity detail sheet (blurs floating rail). */
  forceNestedBackdrop?: boolean;
}

export function DeleteExpenseDialog({
  expenseName,
  mode,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
  forceNestedBackdrop = false,
}: DeleteExpenseDialogProps) {
  const t = useTranslations('expenses');
  const copy =
    mode === 'delete'
      ? {
          title: t('dialogs.deleteTitle'),
          description: t('dialogs.deleteDescription'),
          confirmLabel: t('dialogs.deleteConfirm'),
        }
      : {
          title: t('dialogs.cancelTitle'),
          description: t('dialogs.cancelDescription'),
          confirmLabel: t('dialogs.cancelConfirm'),
        };
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
      forceNestedBackdrop={forceNestedBackdrop}
      onConfirm={onConfirm}
    />
  );
}
