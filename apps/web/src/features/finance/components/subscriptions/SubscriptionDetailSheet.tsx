'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Repeat } from 'lucide-react';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityItemHost,
  ErrorState,
  LoadingState,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { getSubscriptionType } from '@/features/finance/constants/finance';
import {
  subscriptionWorkspaceHref,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import {
  createSubscriptionGeneralDraft,
  isSubscriptionGeneralDirty,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import { formatSubscriptionPeriodStatement } from '@/features/finance/utils/subscription-period-display';
import { formatSubscriptionTermSummary } from '@/features/finance/utils/subscription-term-display';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { SubscriptionBillingPeriodConfirmDialog } from './SubscriptionBillingPeriodConfirmDialog';
import { useSubscriptionGeneralSave } from './use-subscription-general-save';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { SubscriptionGeneralTab } from './SubscriptionGeneralTab';
import { SubscriptionGridStatusControl } from './SubscriptionGridStatusControl';
import { SubscriptionInvoicesTab } from './SubscriptionInvoicesTab';
import { SubscriptionHistoryTab } from './SubscriptionHistoryTab';
import {
  SUBSCRIPTION_DETAIL_SHEET_TABS,
  type SubscriptionDetailSheetTab,
} from './subscription-detail-sheet-tabs';
import { useSubscriptionDetailMutations } from './use-subscription-detail-mutations';

interface SubscriptionDetailSheetProps {
  subscriptionId: string | null;
  initialSubscription?: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionUpdated?: (subscription: Subscription) => void;
}

export function SubscriptionDetailSheet({
  subscriptionId,
  initialSubscription = null,
  open,
  onOpenChange,
  onSubscriptionUpdated,
}: SubscriptionDetailSheetProps) {
  const { persistedValue: sheetId, onOpenChangeComplete } = useSheetPersistedValue(subscriptionId);
  const hostMounted = useSheetHostMounted(open, sheetId);

  const {
    entity: subscription,
    setEntity: setSubscription,
    loading,
    error,
    refresh: fetchSubscription,
  } = useEntityDetailHydration({
    entityId: sheetId ?? '',
    open: open && Boolean(sheetId),
    initialEntity: initialSubscription,
    fetchById: subscriptionsApi.getById,
    isDirty: () => generalDirtyRef.current,
    loadErrorMessage: 'Subscription could not be loaded. It may have been removed.',
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SubscriptionDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<SubscriptionGeneralDraft | null>(null);
  const generalDirtyRef = useRef(false);

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
    [onSubscriptionUpdated, setSubscription],
  );

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

  if (!hostMounted) return null;

  const subType = subscription ? getSubscriptionType(subscription.type) : undefined;
  const termSummary = subscription ? formatSubscriptionTermSummary(subscription) : null;
  const displayTitle = subscription ? getSubscriptionDisplayTitle(subscription) : '';
  const showCodeSubline = subscription ? displayTitle !== subscription.code : false;
  const sourcePageHref = subscriptionsListWithOpenSubscriptionHref(sheetId ?? '');

  return (
    <EntityItemHost nested onEntityChanged={() => void fetchSubscription()}>
      <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          sourcePageHref={sourcePageHref}
          workspaceHref={subscriptionWorkspaceHref(sheetId ?? '')}
        >
          <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
            {loading && !subscription ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : subscription ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                    <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                        {displayTitle}
                      </h2>
                      {showCodeSubline ? (
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {subscription.code}
                        </p>
                      ) : null}
                    </div>
                    {subType ? (
                      <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                        {subType.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
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
                <SubscriptionSheetStatusControl
                  subscription={subscription}
                  onSubscriptionChange={handleSubscriptionChange}
                  onError={setActionError}
                />
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
              {loading && !subscription ? (
                <LoadingState count={3} />
              ) : error ? (
                <ErrorState description={error} onRetry={() => void fetchSubscription()} />
              ) : subscription && generalDraft ? (
                <DetailSheetTabPanel tabKey={activeTab}>
                  {activeTab === 'general' ? (
                    <SubscriptionGeneralTab
                      subscription={subscription}
                      draft={generalDraft}
                      patchDraft={patchGeneralDraft}
                      replaceDraft={replaceGeneralDraft}
                      formDisabled={saving}
                    />
                  ) : null}
                  {activeTab === 'invoice' ? (
                    <SubscriptionInvoicesTab subscription={subscription} />
                  ) : null}
                  {activeTab === 'history' ? <SubscriptionHistoryTab /> : null}
                </DetailSheetTabPanel>
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
      <SubscriptionBillingPeriodConfirmDialog
        open={periodConfirmOpen}
        subscriptionTitle={subscription ? getSubscriptionDisplayTitle(subscription) : ''}
        description={periodConfirmDescription}
        isSubmitting={saving}
        onOpenChange={setPeriodConfirmOpen}
        onConfirm={confirmPeriodChangeAndSave}
        forceNestedBackdrop
      />
    </EntityItemHost>
  );
}

function SubscriptionSheetStatusControl({
  subscription,
  onSubscriptionChange,
  onError,
}: {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
  onError: (message: string | null) => void;
}) {
  const { activatingId, cancellingId, holdingId, handleActivate, handleCancel, handleHold } =
    useSubscriptionDetailMutations(subscription, onSubscriptionChange, onError);

  return (
    <SubscriptionGridStatusControl
      subscription={subscription}
      activatingId={activatingId}
      cancellingId={cancellingId}
      holdingId={holdingId}
      onActivate={() => void handleActivate()}
      onCancel={handleCancel}
      onHold={handleHold}
      forceNestedBackdrop
      size="sm"
    />
  );
}
