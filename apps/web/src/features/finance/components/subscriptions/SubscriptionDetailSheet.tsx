'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Repeat } from 'lucide-react';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';
import {
  subscriptionWorkspaceHref,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import {
  buildSubscriptionGeneralPatch,
  createSubscriptionGeneralDraft,
  isSubscriptionGeneralDirty,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { SubscriptionGeneralTab } from './SubscriptionGeneralTab';
import { SubscriptionInvoicesTab } from './SubscriptionInvoicesTab';
import { SubscriptionHistoryTab } from './SubscriptionHistoryTab';
import {
  SUBSCRIPTION_DETAIL_SHEET_TABS,
  type SubscriptionDetailSheetTab,
} from './subscription-detail-sheet-tabs';

interface SubscriptionDetailSheetProps {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionUpdated?: (subscription: Subscription) => void;
}

function subscriptionSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function SubscriptionDetailSheet({
  subscriptionId,
  open,
  onOpenChange,
  onSubscriptionUpdated,
}: SubscriptionDetailSheetProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SubscriptionDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const generalDirtyRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    if (!subscriptionId) return;
    setLoading(true);
    try {
      const data = await subscriptionsApi.getById(subscriptionId);
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
  }, [subscriptionId]);

  useEffect(() => {
    if (!open || !subscriptionId) return;
    void fetchSubscription();
  }, [open, subscriptionId, fetchSubscription]);

  useEffect(() => {
    setActiveTab('general');
  }, [subscriptionId, open]);

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

  const handleSubscriptionChange = useCallback(
    (updated: Subscription) => {
      setSubscription(updated);
      setActionError(null);
      generalDirtyRef.current = false;
      const next = createSubscriptionGeneralDraft(updated);
      setGeneralDraft(next);
      setGeneralSnap(next);
      onSubscriptionUpdated?.(updated);
    },
    [onSubscriptionUpdated],
  );

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

  if (!subscriptionId) return null;

  const subType = subscription ? getSubscriptionType(subscription.type) : undefined;
  const subStatus = subscription ? getSubscriptionStatus(subscription.status) : undefined;
  const sourcePageHref = subscriptionsListWithOpenSubscriptionHref(subscriptionId);

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchSubscription()}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          sourcePageHref={sourcePageHref}
          workspaceHref={subscriptionWorkspaceHref(subscriptionId)}
        >
          <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : subscription ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                      {subscription.code}
                    </h2>
                    {subType ? (
                      <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        {subType.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {formatAmount(parseFloat(subscription.baseMonthlyAmount))}/mo
                    <span className="mx-1.5">·</span>
                    {subscription.project.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subStatus ? (
                    <StatusBadge label={subStatus.label} variant={subStatus.variant} />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={SUBSCRIPTION_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as SubscriptionDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5">
              {loading ? (
                <LoadingState count={3} />
              ) : error ? (
                <ErrorState description={error} onRetry={() => void fetchSubscription()} />
              ) : subscription && generalDraft ? (
                <>
                  {activeTab === 'general' ? (
                    <SubscriptionGeneralTab
                      subscription={subscription}
                      draft={generalDraft}
                      patchDraft={patchGeneralDraft}
                      formDisabled={saving}
                      onSubscriptionChange={handleSubscriptionChange}
                      onActionError={setActionError}
                    />
                  ) : null}
                  {activeTab === 'invoice' ? (
                    <SubscriptionInvoicesTab subscription={subscription} />
                  ) : null}
                  {activeTab === 'history' ? <SubscriptionHistoryTab /> : null}
                </>
              ) : null}
              {actionError ? (
                <p className="text-destructive mt-4 text-sm" role="alert">
                  {actionError}
                </p>
              ) : null}
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(subscription && generalDraft)}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={handleGeneralSave}
            onCancel={handleGeneralCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>
    </EntityItemHost>
  );
}
