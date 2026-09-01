'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { CreateSubscriptionInvoiceDialog } from '@/features/finance/components/invoices/CreateSubscriptionInvoiceDialog';
import {
  subscriptionWorkspaceHref,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import {
  createSubscriptionGeneralDraft,
  isSubscriptionGeneralDirty,
  type SubscriptionGeneralDraft,
} from '@/features/finance/utils/subscription-general-form-state';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { usePermission } from '@/lib/permissions';
import { buildSubscriptionDetailSheetTabs } from './build-subscription-detail-sheet-tabs';
import { subscriptionCanCreatePeriodInvoice } from './subscription-action-eligibility';
import { SubscriptionBillingPeriodConfirmDialog } from './SubscriptionBillingPeriodConfirmDialog';
import { SubscriptionDetailSheetHeader } from './SubscriptionDetailSheetHeader';
import { SubscriptionGeneralTab } from './SubscriptionGeneralTab';
import { SubscriptionHistoryTab } from './SubscriptionHistoryTab';
import { SubscriptionInvoicesTab } from './SubscriptionInvoicesTab';
import type { SubscriptionDetailSheetTab } from './subscription-detail-sheet-tabs';
import { useSubscriptionGeneralSave } from './use-subscription-general-save';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';

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
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<SubscriptionGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<SubscriptionGeneralDraft | null>(null);
  const generalDirtyRef = useRef(false);

  useEffect(() => {
    setActiveTab('general');
    setCreateInvoiceOpen(false);
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

  const handlePeriodInvoiceCreated = useCallback(async () => {
    if (!subscription) return;
    const updated = await subscriptionsApi.getById(subscription.id);
    handleSubscriptionChange(updated);
  }, [handleSubscriptionChange, subscription]);

  const { can } = usePermission();
  const canCreateInvoice = Boolean(
    subscription &&
    subscriptionCanCreatePeriodInvoice(subscription) &&
    can('EDIT', 'FINANCE_INVOICES'),
  );
  const openCreateInvoice = useCallback(() => setCreateInvoiceOpen(true), []);
  const detailSheetTabs = useMemo(
    () =>
      buildSubscriptionDetailSheetTabs({
        canQuickCreateInvoice: canCreateInvoice,
        onCreateInvoice: openCreateInvoice,
      }),
    [canCreateInvoice, openCreateInvoice],
  );

  const {
    saving,
    generalError,
    saveConfirmOpen,
    saveConfirmTitle,
    saveConfirmDescription,
    closeSaveConfirm,
    handleSave: handleGeneralSave,
    handleCancel: handleGeneralCancel,
    confirmSave,
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
          <div className="bg-background shrink-0 px-7 pt-5 pb-3">
            {loading && !subscription ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : subscription ? (
              <SubscriptionDetailSheetHeader
                subscription={subscription}
                onSubscriptionChange={handleSubscriptionChange}
                onError={setActionError}
              />
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={detailSheetTabs}
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
                    <SubscriptionInvoicesTab
                      subscription={subscription}
                      canCreateInvoice={canCreateInvoice}
                      onCreateInvoice={openCreateInvoice}
                    />
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
        open={saveConfirmOpen}
        title={saveConfirmTitle}
        subscriptionTitle={subscription ? getSubscriptionDisplayTitle(subscription) : ''}
        description={saveConfirmDescription}
        isSubmitting={saving}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeSaveConfirm();
        }}
        onConfirm={confirmSave}
        forceNestedBackdrop
      />
      {subscription ? (
        <CreateSubscriptionInvoiceDialog
          open={createInvoiceOpen}
          onOpenChange={setCreateInvoiceOpen}
          subscription={subscription}
          forceNestedBackdrop
          onCreated={() => void handlePeriodInvoiceCreated()}
        />
      ) : null}
    </EntityItemHost>
  );
}
