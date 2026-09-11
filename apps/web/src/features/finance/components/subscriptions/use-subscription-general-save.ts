import { useCallback, useState } from 'react';
import {
  buildSubscriptionGeneralPatch,
  hasSubscriptionAmountChanged,
  SUBSCRIPTION_AMOUNT_CHANGE_CONFIRM_DESCRIPTION,
  SUBSCRIPTION_AMOUNT_CHANGE_CONFIRM_TITLE,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import {
  buildBillingPeriodChangeConfirmDescription,
  hasSubscriptionBillingPeriodChanged,
} from '@/features/finance/utils/subscription-billing-period-change';
import { getSubscriptionBillingValidationError } from '@/features/finance/utils/subscription-form-state';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

function subscriptionSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

interface UseSubscriptionGeneralSaveOptions {
  subscription: Subscription | null;
  generalDraft: SubscriptionGeneralDraft | null;
  generalSnap: SubscriptionGeneralDraft | null;
  onSaved: (updated: Subscription) => void;
  setGeneralDraft: (draft: SubscriptionGeneralDraft) => void;
  setGeneralSnap: (snap: SubscriptionGeneralDraft) => void;
  onDirtyReset: () => void;
}

export function useSubscriptionGeneralSave({
  subscription,
  generalDraft,
  generalSnap,
  onSaved,
  setGeneralDraft,
  setGeneralSnap,
  onDirtyReset,
}: UseSubscriptionGeneralSaveOptions) {
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [periodConfirmOpen, setPeriodConfirmOpen] = useState(false);
  const [amountConfirmOpen, setAmountConfirmOpen] = useState(false);

  const executeSave = useCallback(async () => {
    if (!subscription || !generalDraft || !generalSnap) return;

    const patch = buildSubscriptionGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });
    setSaving(true);

    try {
      const updated = await subscriptionsApi.update(subscription.id, patch);
      onDirtyReset();
      onSaved(updated);
      setPeriodConfirmOpen(false);
      setAmountConfirmOpen(false);
    } catch (err) {
      setGeneralSnap(snapAtSave);
      setGeneralDraft(draftAtSave);
      setGeneralError(subscriptionSaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [
    generalDraft,
    generalSnap,
    onDirtyReset,
    onSaved,
    setGeneralDraft,
    setGeneralSnap,
    subscription,
  ]);

  const handleSave = useCallback(() => {
    if (!subscription || !generalDraft || !generalSnap) return;
    setGeneralError(null);

    const billingError = getSubscriptionBillingValidationError(generalDraft);
    if (billingError) {
      setGeneralError(billingError);
      return;
    }

    const patch = buildSubscriptionGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    if (hasSubscriptionBillingPeriodChanged(generalSnap, generalDraft)) {
      setPeriodConfirmOpen(true);
      return;
    }

    if (hasSubscriptionAmountChanged(generalSnap, generalDraft)) {
      setAmountConfirmOpen(true);
      return;
    }

    void executeSave();
  }, [executeSave, generalDraft, generalSnap, subscription]);

  const periodConfirmDescription =
    generalDraft && generalSnap
      ? buildBillingPeriodChangeConfirmDescription(
          generalSnap,
          generalDraft,
          subscription?.monthlyEquivalentAmount ?? '0',
        )
      : '';

  const handleCancel = useCallback(() => {
    setGeneralError(null);
    setPeriodConfirmOpen(false);
    setAmountConfirmOpen(false);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap, setGeneralDraft]);

  const closeSaveConfirm = useCallback(() => {
    setPeriodConfirmOpen(false);
    setAmountConfirmOpen(false);
  }, []);

  return {
    saving,
    generalError,
    saveConfirmOpen: periodConfirmOpen || amountConfirmOpen,
    saveConfirmTitle: amountConfirmOpen
      ? SUBSCRIPTION_AMOUNT_CHANGE_CONFIRM_TITLE
      : 'Confirm billing period change?',
    saveConfirmDescription: amountConfirmOpen
      ? SUBSCRIPTION_AMOUNT_CHANGE_CONFIRM_DESCRIPTION
      : periodConfirmDescription,
    closeSaveConfirm,
    handleSave,
    handleCancel,
    confirmSave: () => void executeSave(),
  };
}
