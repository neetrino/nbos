'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  EntitySheetFloatingRail,
  ErrorState,
  LoadingState,
  StatusBadge,
  DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS,
  DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS,
} from '@/components/shared';
import {
  formatAmount,
  getSubscriptionStatus,
  getSubscriptionType,
} from '@/features/finance/constants/finance';
import {
  subscriptionWorkspaceHref,
  subscriptionsListWithOpenSubscriptionHref,
} from '@/features/finance/constants/subscription-deep-link';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { formatSubscriptionDetailDate } from './subscription-detail-format';
import { SubscriptionDetailBody } from './SubscriptionDetailBody';
import { SubscriptionFormDialog } from './SubscriptionFormDialog';

interface SubscriptionDetailSheetProps {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionUpdated?: (subscription: Subscription) => void;
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
  const [editOpen, setEditOpen] = useState(false);

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

  const handleSubscriptionChange = (updated: Subscription) => {
    setSubscription(updated);
    setActionError(null);
    onSubscriptionUpdated?.(updated);
  };

  if (!subscriptionId) return null;

  const subType = subscription ? getSubscriptionType(subscription.type) : undefined;
  const subStatus = subscription ? getSubscriptionStatus(subscription.status) : undefined;
  const sourcePageHref = subscriptionsListWithOpenSubscriptionHref(subscriptionId);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          floatingClose
          floatingRailVisible={open}
          floatingRailAnchorClassName={DETAIL_SHEET_FLOATING_RAIL_ANCHOR_75VW_CLASS}
          floatingRail={
            <EntitySheetFloatingRail
              sourcePageHref={sourcePageHref}
              workspaceHref={subscriptionWorkspaceHref(subscriptionId)}
            />
          }
          className={DETAIL_SHEET_CONTENT_WIDTH_75VW_CLASS}
        >
          <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : subscription ? (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                    {subscription.code}
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {formatAmount(parseFloat(subscription.baseMonthlyAmount))}/mo
                    <span className="mx-1.5">·</span>
                    {subscription.project.name}
                    <span className="mx-1.5">·</span>
                    Started {formatSubscriptionDetailDate(subscription.billingStartDate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subStatus ? (
                    <StatusBadge label={subStatus.label} variant={subStatus.variant} />
                  ) : null}
                  {subType ? <StatusBadge label={subType.label} variant={subType.variant} /> : null}
                </div>
              </div>
            ) : null}
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5">
              {loading ? (
                <LoadingState count={3} />
              ) : error ? (
                <ErrorState description={error} onRetry={() => void fetchSubscription()} />
              ) : subscription ? (
                <SubscriptionDetailBody
                  subscription={subscription}
                  onSubscriptionChange={handleSubscriptionChange}
                  actionError={actionError}
                  onDismissActionError={() => setActionError(null)}
                  onActionError={setActionError}
                  onEditBilling={() => setEditOpen(true)}
                />
              ) : null}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {subscription ? (
        <SubscriptionFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          subscription={subscription}
          onSaved={handleSubscriptionChange}
        />
      ) : null}
    </>
  );
}
