'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { DeleteConfirmDialog } from '@/components/shared';

export function useCompositionRemove(
  confirm: boolean,
  onRemoveExtra: (functionId: string) => void,
) {
  const [pending, setPending] = useState<DeliveryFunctionOperationalDto | null>(null);
  return {
    request: (item: DeliveryFunctionOperationalDto) => {
      if (confirm) setPending(item);
      else onRemoveExtra(item.id);
    },
    title: pending?.title ?? '',
    open: pending !== null,
    onOpenChange: (open: boolean) => {
      if (!open) setPending(null);
    },
    onConfirm: () => {
      if (pending) onRemoveExtra(pending.id);
      setPending(null);
    },
  };
}

export function CompositionRemoveDialog({
  title,
  open,
  submitting,
  onOpenChange,
  onConfirm,
}: {
  title: string;
  open: boolean;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const tCommon = useTranslations('common');
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      level="simple"
      itemName={title}
      title={t('removeFunctionTitle')}
      description={t('removeFunctionDescription', { title })}
      confirmLabel={t('removeFunctionConfirm')}
      dismissLabel={tCommon('cancel')}
      isSubmitting={submitting === true}
      forceNestedBackdrop
      onConfirm={onConfirm}
    />
  );
}
