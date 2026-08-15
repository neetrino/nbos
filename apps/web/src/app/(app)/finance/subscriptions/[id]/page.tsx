'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Repeat } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { DetailSheetFormFooter, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { subscriptionDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { SubscriptionBillingPeriodConfirmDialog } from '@/features/finance/components/subscriptions/SubscriptionBillingPeriodConfirmDialog';
import { SubscriptionGeneralTab } from '@/features/finance/components/subscriptions/SubscriptionGeneralTab';
import { useSubscriptionGeneralSave } from '@/features/finance/components/subscriptions/use-subscription-general-save';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  createSubscriptionGeneralDraft,
  isSubscriptionGeneralDirty,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import { formatSubscriptionPeriodStatement } from '@/features/finance/utils/subscription-period-display';
import { formatSubscriptionTermSummary } from '@/features/finance/utils/subscription-term-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { getSubscriptionStatus, getSubscriptionType } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalDraft, setGeneralDraft] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<SubscriptionGeneralDraft | null>(null);
  const generalDirtyRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await subscriptionsApi.getById(id);
      setSubscription(data);
      setError(null);
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
    subscription?.amount,
    subscription?.billingDay,
    subscription?.billingFrequency,
    subscription?.coverageMonthCount,
    subscription?.partner?.id,
  ]);

  const patchGeneralDraft = useCallback((partial: Partial<SubscriptionGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const replaceGeneralDraft = useCallback((next: SubscriptionGeneralDraft) => {
    setGeneralDraft(next);
  }, []);

  const generalDirty =
    generalDraft != null &&
    generalSnap != null &&
    isSubscriptionGeneralDirty(generalDraft, generalSnap);
  generalDirtyRef.current = generalDirty;

  const handleSubscriptionChange = useCallback((updated: Subscription) => {
    setSubscription(updated);
    generalDirtyRef.current = false;
    const next = createSubscriptionGeneralDraft(updated);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, []);

  const {
    saving,
    generalError,
    periodConfirmOpen,
    setPeriodConfirmOpen,
    periodConfirmDescription,
    handleSave: handleGeneralSave,
    handleCancel: handleGeneralCancel,
    confirmPeriodChangeAndSave,
  } = useSubscriptionGeneralSave({
    subscription,
    generalDraft,
    generalSnap,
    onSaved: handleSubscriptionChange,
    setGeneralDraft,
    setGeneralSnap,
    onDirtyReset: () => {
      generalDirtyRef.current = false;
    },
  });

  useFinanceDocumentTitle(
    subscriptionDetailPageTitle({
      loading,
      loadFailed: Boolean(error || !subscription),
      subscriptionName: subscription?.name,
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
  const termSummary = formatSubscriptionTermSummary(subscription);
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const showCodeSubline = displayTitle !== subscription.code;

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
              <div className="min-w-0">
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                  {displayTitle}
                </h1>
                {showCodeSubline ? (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {subscription.code}
                  </p>
                ) : null}
              </div>
              {subType ? (
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                  {subType.label}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatSubscriptionPeriodStatement(subscription)}
              {termSummary ? (
                <>
                  <span className="mx-1.5">·</span>
                  {termSummary}
                </>
              ) : null}
              <span className="mx-1.5">·</span>
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
          replaceDraft={replaceGeneralDraft}
          formDisabled={saving}
        />
      </div>

      <DetailSheetFormFooter
        visible
        dirty={generalDirty}
        saving={saving}
        errorMessage={generalError}
        onSave={handleGeneralSave}
        onCancel={handleGeneralCancel}
      />

      <SubscriptionBillingPeriodConfirmDialog
        open={periodConfirmOpen}
        subscriptionTitle={getSubscriptionDisplayTitle(subscription)}
        description={periodConfirmDescription}
        isSubmitting={saving}
        onOpenChange={setPeriodConfirmOpen}
        onConfirm={confirmPeriodChangeAndSave}
      />
    </div>
  );
}
