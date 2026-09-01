'use client';

import { Repeat } from 'lucide-react';
import { getSubscriptionType } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { formatSubscriptionPeriodStatement } from '@/features/finance/utils/subscription-period-display';
import { formatSubscriptionTermSummary } from '@/features/finance/utils/subscription-term-display';
import type { Subscription } from '@/lib/api/finance';
import { SubscriptionGridStatusControl } from './SubscriptionGridStatusControl';
import { useSubscriptionDetailMutations } from './use-subscription-detail-mutations';

interface SubscriptionDetailSheetHeaderProps {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
  onError: (message: string | null) => void;
}

export function SubscriptionDetailSheetHeader({
  subscription,
  onSubscriptionChange,
  onError,
}: SubscriptionDetailSheetHeaderProps) {
  const subType = getSubscriptionType(subscription.type);
  const termSummary = formatSubscriptionTermSummary(subscription);
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const showCodeSubline = displayTitle !== subscription.code;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
          <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
              {displayTitle}
            </h2>
            {showCodeSubline ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{subscription.code}</p>
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
        onSubscriptionChange={onSubscriptionChange}
        onError={onError}
      />
    </div>
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
