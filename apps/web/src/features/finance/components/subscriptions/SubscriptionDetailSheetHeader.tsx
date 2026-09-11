'use client';

import { Repeat } from 'lucide-react';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { getSubscriptionType } from '@/features/finance/constants/finance';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { formatSubscriptionPeriodStatement } from '@/features/finance/utils/subscription-period-display';
import { formatSubscriptionTermSummary } from '@/features/finance/utils/subscription-term-display';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import type { Subscription } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
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
  const isMobileViewport = useIsMobileViewport();
  const subType = getSubscriptionType(subscription.type);
  const termSummary = formatSubscriptionTermSummary(subscription);
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const showCodeSubline = displayTitle !== subscription.code;
  const statusControl = (
    <SubscriptionSheetStatusControl
      subscription={subscription}
      onSubscriptionChange={onSubscriptionChange}
      onError={onError}
    />
  );

  if (isMobileViewport) {
    return (
      <div className={DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS}>
        <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>{statusControl}</div>
        <div className={cn(DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS, 'space-y-1')}>
          <SubscriptionHeaderIdentity
            displayTitle={displayTitle}
            showCodeSubline={showCodeSubline}
            code={subscription.code}
            typeLabel={subType?.label}
          />
          <SubscriptionHeaderSummary
            subscription={subscription}
            termSummary={termSummary}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-wrap items-start justify-between gap-3 shrink-0 px-7 pt-5 pb-3">
      <div className="min-w-0 flex-1">
        <SubscriptionHeaderIdentity
          displayTitle={displayTitle}
          showCodeSubline={showCodeSubline}
          code={subscription.code}
          typeLabel={subType?.label}
        />
        <SubscriptionHeaderSummary subscription={subscription} termSummary={termSummary} />
      </div>
      {statusControl}
    </div>
  );
}

function SubscriptionHeaderIdentity({
  displayTitle,
  showCodeSubline,
  code,
  typeLabel,
}: {
  displayTitle: string;
  showCodeSubline: boolean;
  code: string;
  typeLabel: string | undefined;
}) {
  return (
    <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <h2 className="text-foreground truncate text-xl font-bold tracking-tight">{displayTitle}</h2>
        {showCodeSubline ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{code}</p>
        ) : null}
      </div>
      {typeLabel ? (
        <span className="text-muted-foreground rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
          {typeLabel}
        </span>
      ) : null}
    </div>
  );
}

function SubscriptionHeaderSummary({
  subscription,
  termSummary,
}: {
  subscription: Subscription;
  termSummary: string | null;
}) {
  return (
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
