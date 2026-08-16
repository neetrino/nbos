import {
  buildSubscriptionCreatePayload,
  buildSubscriptionUpdatePayload,
  getSubscriptionBillingValidationError,
  type SubscriptionFormState,
} from '@/features/finance/utils/subscription-form-state';
import {
  applyBillingPeriodChangeToDraft,
  hasSubscriptionBillingPeriodChanged,
} from '@/features/finance/utils/subscription-billing-period-change';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { useCallback, useState } from 'react';

interface UseSubscriptionFormDialogActionsOptions {
  mode: 'create' | 'edit';
  form: SubscriptionFormState;
  setForm: React.Dispatch<React.SetStateAction<SubscriptionFormState>>;
  editSnap: SubscriptionFormState | null;
  subscription: Subscription | null;
  onSaved: (subscription: Subscription) => void;
  onOpenChange: (open: boolean) => void;
}

export function useSubscriptionFormDialogActions({
  mode,
  form,
  setForm,
  editSnap,
  subscription,
  onSaved,
  onOpenChange,
}: UseSubscriptionFormDialogActionsOptions) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [periodConfirmOpen, setPeriodConfirmOpen] = useState(false);

  const parsedAmount = parseFloat(form.amount.replace(/\s/g, ''));
  const parsedBillingDay = parseInt(form.billingDay, 10);
  const billingValidationError = getSubscriptionBillingValidationError(form);
  const canSubmit =
    Boolean(form.name.trim()) &&
    (mode === 'edit' || Boolean(form.productId)) &&
    Boolean(form.type) &&
    Boolean(form.billingStartDate) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    Number.isFinite(parsedBillingDay) &&
    parsedBillingDay >= 1 &&
    parsedBillingDay <= 28 &&
    billingValidationError == null;

  const submitForm = useCallback(async () => {
    setLoading(true);
    setFormError(null);
    try {
      const saved =
        mode === 'edit' && subscription
          ? await subscriptionsApi.update(subscription.id, buildSubscriptionUpdatePayload(form))
          : await subscriptionsApi.create(buildSubscriptionCreatePayload(form));
      onSaved(saved);
      onOpenChange(false);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Could not save subscription.'));
    } finally {
      setLoading(false);
    }
  }, [form, mode, onOpenChange, onSaved, subscription]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!canSubmit) return;
      if (
        mode === 'edit' &&
        editSnap &&
        subscription &&
        hasSubscriptionBillingPeriodChanged(editSnap, form)
      ) {
        setPeriodConfirmOpen(true);
        return;
      }
      await submitForm();
    },
    [canSubmit, editSnap, form, mode, subscription, submitForm],
  );

  const monthlyEquivalent = subscription ? parseFloat(subscription.monthlyEquivalentAmount) : 0;

  const applyPeriodChange = useCallback(
    (changes: Partial<Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>>) => {
      if (mode === 'edit' && subscription && Number.isFinite(monthlyEquivalent)) {
        setForm((current) => applyBillingPeriodChangeToDraft(current, changes, monthlyEquivalent));
        return;
      }
      setForm((current) => {
        const billingFrequency = changes.billingFrequency ?? current.billingFrequency;
        return {
          ...current,
          ...changes,
          billingFrequency,
          coverageMonthCount:
            billingFrequency === 'CUSTOM'
              ? (changes.coverageMonthCount ?? current.coverageMonthCount)
              : '',
        };
      });
    },
    [mode, monthlyEquivalent, setForm, subscription],
  );

  return {
    loading,
    formError,
    canSubmit,
    billingValidationError,
    periodConfirmOpen,
    setPeriodConfirmOpen,
    handleSubmit,
    submitForm,
    applyPeriodChange,
  };
}
