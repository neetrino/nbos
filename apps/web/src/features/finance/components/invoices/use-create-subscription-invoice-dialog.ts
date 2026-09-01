import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { Invoice } from '@/lib/api/finance';
import { subscriptionsApi, type Subscription } from '@/lib/api/subscriptions';
import {
  defaultSubscriptionInvoiceMonth,
  listEligibleSubscriptionInvoiceMonths,
} from '@/features/finance/utils/subscription-invoice-months';

export interface CreateSubscriptionInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoice: Invoice) => Promise<void> | void;
  subscription?: Subscription | null;
  subscriptionId?: string | null;
  forceNestedBackdrop?: boolean;
}

export function useCreateSubscriptionInvoiceDialog({
  open,
  onOpenChange,
  onCreated,
  subscription: subscriptionProp,
  subscriptionId,
}: CreateSubscriptionInvoiceDialogProps) {
  const state = usePeriodInvoiceDialogState(subscriptionProp ?? null);
  useHydrateSubscriptionInvoiceDialog({
    open,
    subscriptionProp: subscriptionProp ?? null,
    subscriptionId,
    ...state,
  });
  const eligibleMonths = state.subscription
    ? listEligibleSubscriptionInvoiceMonths(state.subscription)
    : [];
  const canSubmit = Boolean(
    state.subscription && state.coverageMonth && eligibleMonths.includes(state.coverageMonth),
  );
  return {
    subscription: state.subscription,
    coverageMonth: state.coverageMonth,
    setCoverageMonth: state.setCoverageMonth,
    eligibleMonths,
    loading: state.loading,
    submitting: state.submitting,
    loadError: state.loadError,
    error: state.error,
    canSubmit,
    onOpenChange,
    handleSubmit: bindPeriodInvoiceSubmit({
      ...state,
      canSubmit,
      onCreated,
      onOpenChange,
    }),
  };
}

function usePeriodInvoiceDialogState(initial: Subscription | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(initial);
  const [coverageMonth, setCoverageMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  return {
    subscription,
    setSubscription,
    coverageMonth,
    setCoverageMonth,
    loading,
    setLoading,
    submitting,
    setSubmitting,
    loadError,
    setLoadError,
    error,
    setError,
    submittingRef,
  };
}

/** Returns false when a submit is already running (double-click / overlapping await). */
export function claimInFlightSubmit(flag: { current: boolean }): boolean {
  if (flag.current) return false;
  flag.current = true;
  return true;
}

function useHydrateSubscriptionInvoiceDialog(args: {
  open: boolean;
  subscriptionProp: Subscription | null;
  subscriptionId?: string | null;
  submittingRef: { current: boolean };
  setSubscription: (value: Subscription | null) => void;
  setCoverageMonth: (value: string) => void;
  setLoading: (value: boolean) => void;
  setLoadError: (value: string | null) => void;
  setError: (value: string | null) => void;
  setSubmitting: (value: boolean) => void;
}): void {
  const { open, subscriptionProp, subscriptionId } = args;
  useEffect(() => {
    if (!open) {
      args.submittingRef.current = false;
      args.setSubmitting(false);
      args.setError(null);
      return;
    }
    let cancelled = false;
    void hydrateDialogSubscription({
      subscriptionProp,
      subscriptionId,
      onStart: () => {
        args.setLoading(true);
        args.setLoadError(null);
        args.setError(null);
      },
      onDone: (next, loadErrorMessage) => {
        if (cancelled) return;
        args.setSubscription(next);
        args.setLoadError(loadErrorMessage);
        args.setCoverageMonth(pickDefaultMonth(next));
        args.setLoading(false);
      },
    });
    return () => {
      cancelled = true;
    };
    // Re-hydrate when the dialog opens or the target subscription changes, not on object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subscriptionId, subscriptionProp?.id]);
}

function pickDefaultMonth(subscription: Subscription | null): string {
  if (!subscription) return '';
  return defaultSubscriptionInvoiceMonth(
    listEligibleSubscriptionInvoiceMonths(subscription),
    new Date(),
  );
}

async function hydrateDialogSubscription(args: {
  subscriptionProp: Subscription | null;
  subscriptionId?: string | null;
  onStart: () => void;
  onDone: (subscription: Subscription | null, loadError: string | null) => void;
}): Promise<void> {
  if (args.subscriptionProp) {
    args.onDone(args.subscriptionProp, null);
    return;
  }
  const id = args.subscriptionId?.trim();
  if (!id) {
    args.onDone(null, 'Subscription is required.');
    return;
  }
  args.onStart();
  try {
    args.onDone(await subscriptionsApi.getById(id), null);
  } catch (caught) {
    args.onDone(null, getApiErrorMessage(caught, 'Subscription could not be loaded.'));
  }
}

type PeriodInvoiceSubmitArgs = {
  subscription: Subscription | null;
  coverageMonth: string;
  canSubmit: boolean;
  onCreated: (invoice: Invoice) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  submittingRef: { current: boolean };
  setSubmitting: (value: boolean) => void;
  setError: (value: string | null) => void;
};

function bindPeriodInvoiceSubmit(args: PeriodInvoiceSubmitArgs) {
  return (event: FormEvent) => void submitSubscriptionPeriodInvoice(event, args);
}

async function submitSubscriptionPeriodInvoice(
  event: FormEvent,
  args: PeriodInvoiceSubmitArgs,
): Promise<void> {
  event.preventDefault();
  if (!args.subscription || !args.canSubmit) return;
  if (!claimInFlightSubmit(args.submittingRef)) return;
  args.setSubmitting(true);
  args.setError(null);
  try {
    const created = await subscriptionsApi.createInvoice(args.subscription.id, {
      coverageMonth: args.coverageMonth,
    });
    toast.success(`Invoice ${created.code} created`);
    await args.onCreated(created);
    args.onOpenChange(false);
  } catch (caught) {
    args.setError(getApiErrorMessage(caught, 'Invoice could not be created.'));
  } finally {
    args.submittingRef.current = false;
    args.setSubmitting(false);
  }
}
