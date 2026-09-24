'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/shared';

export function FunctionCollectionDeleteDialog({
  open,
  name,
  submitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  name: string;
  submitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const tCommon = useTranslations('common');
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      level="strong"
      itemName={name}
      title={t('collections.deleteTitle')}
      description={t('collections.deleteDescription')}
      confirmLabel={t('collections.delete')}
      dismissLabel={tCommon('cancel')}
      submittingLabel={t('collections.deleting')}
      isSubmitting={submitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
    />
  );
}
