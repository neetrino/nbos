'use client';

import { Repeat } from 'lucide-react';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { useCommitEntityName } from '@/features/finance/hooks/use-commit-entity-name';
import { getSubscriptionType } from '@/features/finance/constants/finance';
import { InlineEditableEntityTitle } from '@/features/projects/components/InlineEditableEntityTitle';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { SubscriptionGridStatusControl } from './SubscriptionGridStatusControl';
import { useSubscriptionDetailMutations } from './use-subscription-detail-mutations';

const SUBSCRIPTION_RENAME_HINT = 'Click to edit name';
const SUBSCRIPTION_NAME_PLACEHOLDER = 'Commercial subscription name';
const SUBSCRIPTION_RENAME_SUCCESS = 'Subscription updated';
const SUBSCRIPTION_RENAME_ERROR = 'Could not save subscription.';

interface SubscriptionDetailSheetHeaderProps {
  subscription: Subscription;
  canRename: boolean;
  onNameSaved: (updated: Subscription) => void;
  onSubscriptionChange: (updated: Subscription) => void;
  onError: (message: string | null) => void;
}

export function SubscriptionDetailSheetHeader({
  subscription,
  canRename,
  onNameSaved,
  onSubscriptionChange,
  onError,
}: SubscriptionDetailSheetHeaderProps) {
  const isMobileViewport = useIsMobileViewport();
  const subType = getSubscriptionType(subscription.type);
  const displayTitle = getSubscriptionDisplayTitle(subscription);
  const titleBlock = (
    <SubscriptionHeaderIdentity
      subscriptionId={subscription.id}
      displayTitle={displayTitle}
      showCodeSubline={displayTitle !== subscription.code}
      code={subscription.code}
      typeLabel={subType?.label}
      canRename={canRename}
      onNameSaved={onNameSaved}
    />
  );
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
          {titleBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex shrink-0 flex-wrap items-start justify-between gap-3 px-7 pt-5 pb-3">
      <div className="min-w-0 flex-1">{titleBlock}</div>
      {statusControl}
    </div>
  );
}

function SubscriptionHeaderIdentity({
  subscriptionId,
  displayTitle,
  showCodeSubline,
  code,
  typeLabel,
  canRename,
  onNameSaved,
}: {
  subscriptionId: string;
  displayTitle: string;
  showCodeSubline: boolean;
  code: string;
  typeLabel: string | undefined;
  canRename: boolean;
  onNameSaved: (updated: Subscription) => void;
}) {
  return (
    <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <Repeat className="text-muted-foreground size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <SubscriptionEditableTitle
          subscriptionId={subscriptionId}
          name={displayTitle}
          canRename={canRename}
          onNameSaved={onNameSaved}
          titleClassName="text-xl font-bold tracking-tight"
        />
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

export function SubscriptionEditableTitle({
  subscriptionId,
  name,
  canRename,
  onNameSaved,
  titleClassName,
}: {
  subscriptionId: string;
  name: string;
  canRename: boolean;
  onNameSaved: (updated: Subscription) => void;
  titleClassName: string;
}) {
  const commitName = useCommitEntityName({
    enabled: canRename,
    save: (nextName) => subscriptionsApi.update(subscriptionId, { name: nextName }),
    onSaved: onNameSaved,
    successMessage: SUBSCRIPTION_RENAME_SUCCESS,
    errorMessage: SUBSCRIPTION_RENAME_ERROR,
  });

  return (
    <InlineEditableEntityTitle
      value={name}
      disabled={!canRename}
      editHint={SUBSCRIPTION_RENAME_HINT}
      placeholder={SUBSCRIPTION_NAME_PLACEHOLDER}
      onCommit={commitName}
      titleClassName={titleClassName}
    />
  );
}
