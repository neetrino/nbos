import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi, type BonusEntryListRow, type BonusReleaseRow } from '@/lib/api/bonus';
import type { AdjustFormState } from '@/features/finance/components/bonus/bonus-entry-release-adjust-block';

function parseReleaseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function validateAdjustForm(
  form: AdjustFormState,
  row: BonusReleaseRow | undefined,
): { error: string } | { payload: { amount: number; reason: string; approvedById?: string } } {
  const amount = Number.parseFloat(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter a positive amount.' };
  }
  const reason = form.reason.trim();
  if (reason.length === 0) {
    return { error: 'Reason is required.' };
  }
  const payload: { amount: number; reason: string; approvedById?: string } = {
    amount,
    reason,
  };
  if (row?.releaseType === 'OVER_FUNDING') {
    const a = form.approvedById.trim();
    if (a.length === 0) {
      return { error: 'Approver id is required for OVER_FUNDING.' };
    }
    payload.approvedById = a;
  }
  return { payload };
}

function useBonusReleasesLoad(entry: BonusEntryListRow | null, open: boolean) {
  const [rows, setRows] = useState<BonusReleaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!entry) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await bonusesApi.listReleasesForEntry(entry.id);
      setRows(data);
    } catch (caught) {
      setRows([]);
      setLoadError(getApiErrorMessage(caught, 'Releases could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [entry]);

  useEffect(() => {
    if (open && entry) {
      void reload();
    }
  }, [open, entry, reload]);

  return { rows, loading, loadError, reload };
}

function useBonusReleasesAdjust(
  entry: BonusEntryListRow | null,
  open: boolean,
  rows: BonusReleaseRow[],
  reload: () => Promise<void>,
  onAfterPatch: () => void,
) {
  const [adjustTarget, setAdjustTarget] = useState<BonusReleaseRow | null>(null);
  const [form, setForm] = useState<AdjustFormState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && entry) {
      setAdjustTarget(null);
      setForm(null);
      setSubmitError(null);
    }
  }, [open, entry]);

  const startAdjust = useCallback((r: BonusReleaseRow) => {
    setAdjustTarget(r);
    setSubmitError(null);
    setForm({
      releaseId: r.id,
      amount: String(parseReleaseAmount(r.amount)),
      reason: '',
      approvedById: '',
    });
  }, []);

  const submitAdjust = useCallback(async () => {
    if (!entry || !form) return;
    const row = rows.find((x) => x.id === form.releaseId);
    const validated = validateAdjustForm(form, row);
    if ('error' in validated) {
      setSubmitError(validated.error);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bonusesApi.patchRelease(entry.id, form.releaseId, validated.payload);
      setAdjustTarget(null);
      setForm(null);
      await reload();
      onAfterPatch();
    } catch (caught) {
      setSubmitError(getApiErrorMessage(caught, 'Could not save adjustment.'));
    } finally {
      setSubmitting(false);
    }
  }, [entry, form, reload, onAfterPatch, rows]);

  return {
    adjustTarget,
    form,
    setForm,
    submitError,
    submitting,
    startAdjust,
    submitAdjust,
  };
}

export function useBonusEntryReleasesLedger(
  entry: BonusEntryListRow | null,
  open: boolean,
  onAfterPatch: () => void,
) {
  const { rows, loading, loadError, reload } = useBonusReleasesLoad(entry, open);
  const adjust = useBonusReleasesAdjust(entry, open, rows, reload, onAfterPatch);
  return {
    rows,
    loading,
    loadError,
    ...adjust,
  };
}
