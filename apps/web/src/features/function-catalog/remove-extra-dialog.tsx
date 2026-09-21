'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormDialog } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { REMOVE_REASON_FIELD_ID } from './function-catalog.constants';

export function RemoveExtraDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const t = useTranslations('hr.functionCatalog');
  const tCommon = useTranslations('common');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const ok = await onConfirm(trimmed);
      if (ok) {
        setReason('');
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
      title={t('removeFunctionTitle')}
      description={t('addFunctionReasonHint')}
      submitting={saving}
      canSubmit={reason.trim().length > 0 && !saving}
      submitLabel={t('removeFunctionConfirm')}
      submittingLabel={t('removeFunctionConfirming')}
      cancelLabel={tCommon('cancel')}
      forceNestedBackdrop
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="space-y-1.5">
        <Label htmlFor={REMOVE_REASON_FIELD_ID}>{t('addFunctionReasonLabel')}</Label>
        <Input
          id={REMOVE_REASON_FIELD_ID}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('removeFunctionReasonPlaceholder')}
        />
      </div>
    </CreateFormDialog>
  );
}
