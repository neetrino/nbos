'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PlannedAdjustFormState } from '@/features/finance/components/bonus/bonus-entry-planned-adjust-block';
import { bonusesApi, type BonusEntryListRow } from '@/lib/api/bonus';
import { getApiErrorMessage } from '@/lib/api-errors';

function initialForm(entry: BonusEntryListRow): PlannedAdjustFormState {
  return {
    amount: entry.amount,
    reason: '',
    title: entry.title ?? '',
  };
}

export function useBonusEntryPlannedAdjust(
  entry: BonusEntryListRow | null,
  open: boolean,
  onSaved: () => void,
) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlannedAdjustFormState | null>(null);
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
  }, [open, entry?.id, entry?.amount, entry?.title]);

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
      await bonusesApi.patchPlannedAmount(entry.id, {
        amount: form.amount,
        reason,
        title: form.title.trim() || undefined,
      });
      setEditing(false);
      onSaved();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err, 'Planned amount could not be saved.'));
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
