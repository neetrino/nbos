'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PayableAdjustFormState } from '@/features/finance/components/bonus/bonus-entry-payable-adjust-block';
import { bonusesApi, type BonusEntryListRow } from '@/lib/api/bonus';
import { bonusEntryPayableAdjustment } from '@/features/finance/utils/bonus-entry-payable';
import { getApiErrorMessage } from '@/lib/api-errors';

function initialForm(entry: BonusEntryListRow): PayableAdjustFormState {
  return {
    adjustment: String(bonusEntryPayableAdjustment(entry)),
    reason: '',
  };
}

export function useBonusEntryPayableAdjust(
  entry: BonusEntryListRow | null,
  open: boolean,
  onSaved: () => void,
) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PayableAdjustFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) {
      setEditing(false);
      setForm(null);
      setSubmitError(null);
      return;
    }
    setForm(initialForm(entry));
    setEditing(false);
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form reset keyed on entry.id
  }, [open, entry?.id, entry?.payableAdjustment, entry?.payableAmount]);

  const startEdit = useCallback(() => {
    if (!entry) return;
    setForm(initialForm(entry));
    setEditing(true);
    setSubmitError(null);
  }, [entry]);

  const submit = useCallback(async () => {
    if (!entry || !form) return;
    const reason = form.reason.trim();
    if (reason.length === 0) {
      setSubmitError('Reason is required');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bonusesApi.patchPayableAdjustment(entry.id, {
        adjustment: form.adjustment,
        reason,
      });
      setEditing(false);
      onSaved();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, 'Payable adjustment could not be saved.'));
    } finally {
      setSubmitting(false);
    }
  }, [entry, form, onSaved]);

  return {
    editing,
    form,
    setForm,
    startEdit,
    submit,
    submitting,
    submitError,
  };
}
