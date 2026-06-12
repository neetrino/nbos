'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Repeat } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DetailSheetFormFooter, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { subscriptionDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { SubscriptionGeneralTab } from '@/features/finance/components/subscriptions/SubscriptionGeneralTab';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  buildSubscriptionGeneralPatch,
  createSubscriptionGeneralDraft,
  isSubscriptionGeneralDirty,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

function subscriptionSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generalDraft, setGeneralDraft] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const generalDirtyRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await subscriptionsApi.getById(id);
      setSubscription(data);
      setError(null);
      setActionError(null);
    } catch (caught) {
      setSubscription(null);
      setError(
        getApiErrorMessage(caught, 'Subscription could not be loaded. It may have been removed.'),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useLayoutEffect(() => {
    if (!subscription) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createSubscriptionGeneralDraft(subscription);
    setGeneralDraft(next);
    setGeneralSnap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on subscription.id
  }, [
    subscription?.id,
    subscription?.status,
    subscription?.baseMonthlyAmount,
    subscription?.billingDay,
    subscription?.billingFrequency,
    subscription?.partner?.id,
  ]);

  const patchGeneralDraft = useCallback((partial: Partial<SubscriptionGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null &&
    generalSnap != null &&
    isSubscriptionGeneralDirty(generalDraft, generalSnap);
  generalDirtyRef.current = generalDirty;

  const handleSubscriptionChange = useCallback((updated: Subscription) => {
    setSubscription(updated);
    setActionError(null);
    generalDirtyRef.current = false;
    const next = createSubscriptionGeneralDraft(updated);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, []);

  const handleGeneralSave = useCallback(() => {
    if (!subscription || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildSubscriptionGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });
    setSaving(true);

    void (async () => {
      try {
        const updated = await subscriptionsApi.update(subscription.id, patch);
        generalDirtyRef.current = false;
        handleSubscriptionChange(updated);
      } catch (err) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(subscriptionSaveErrorMessage(err));
      } finally {
        setSaving(false);
      }
    })();
  }, [subscription, generalDraft, generalSnap, handleSubscriptionChange]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  useFinanceDocumentTitle(
    subscriptionDetailPageTitle({
      loading,
      loadFailed: Boolean(error || !subscription),
      subscriptionCode: subscription?.code,
    }),
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !subscription || !generalDraft) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href="/finance/subscriptions"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Back to subscriptions"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Subscription</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={() => void fetchSubscription()} />
      </div>
    );
  }

  const subType = getSubscriptionType(subscription.type);
  const subStatus = getSubscriptionStatus(subscription.status);

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="border-border shrink-0 border-b px-1 pb-4">
        <div className="flex items-start gap-3">
          <Link
            href="/finance/subscriptions"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label="Back to subscriptions"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="inline-flex flex-wrap items-center gap-2">
              <Repeat className="text-muted-foreground size-5" aria-hidden />
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                {subscription.code}
              </h1>
              {subType ? (
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  {subType.label}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatAmount(parseFloat(subscription.baseMonthlyAmount))}/mo ·{' '}
              {subscription.project.name}
            </p>
          </div>
          {subStatus ? <StatusBadge label={subStatus.label} variant={subStatus.variant} /> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-5">
        <SubscriptionGeneralTab
          subscription={subscription}
          draft={generalDraft}
          patchDraft={patchGeneralDraft}
          formDisabled={saving}
          onSubscriptionChange={handleSubscriptionChange}
          onActionError={setActionError}
        />
        {actionError ? (
          <p className="text-destructive mt-4 text-sm" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      <DetailSheetFormFooter
        visible
        dirty={generalDirty}
        saving={saving}
        errorMessage={generalError}
        onSave={handleGeneralSave}
        onCancel={handleGeneralCancel}
      />
    </div>
  );
}
