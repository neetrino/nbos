'use client';

import { useState } from 'react';
import {
  ChevronDown,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSubscriptionStatus } from '@/features/finance/constants/finance';
import type { Subscription } from '@/lib/api/finance';
import {
  subscriptionCanActivateOrResume,
  subscriptionCanCancel,
  subscriptionCanHold,
} from './subscription-action-eligibility';
import { SubscriptionCancelDialog } from './SubscriptionCancelDialog';
import { SubscriptionHoldDialog } from './SubscriptionHoldDialog';

const STATUS_BUTTON_CLASS: Record<string, string> = {
  PENDING:
    'border-amber-300/80 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  ACTIVE:
    'border-green-300/80 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200',
  ON_HOLD: 'border-border bg-muted text-muted-foreground',
  CANCELLED:
    'border-red-300/80 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  COMPLETED:
    'border-blue-300/80 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
};

const RESUME_FROM_STATUSES = new Set(['ON_HOLD', 'CANCELLED']);

interface SubscriptionGridStatusControlProps {
  subscription: Subscription;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
  /** Use when the control sits inside a detail sheet (nested dialogs). */
  forceNestedBackdrop?: boolean;
  size?: 'xs' | 'sm';
}

interface StatusMenuProps {
  subscription: Subscription;
  size: 'xs' | 'sm';
  isBusy: boolean;
  isLockedOut: boolean;
  isActivating: boolean;
  isCancelling: boolean;
  isHolding: boolean;
  onActivate: (subscription: Subscription) => void;
  onOpenCancel: () => void;
  onOpenHold: () => void;
}

function statusControlClass(status: string, size: 'xs' | 'sm'): string {
  const palette = STATUS_BUTTON_CLASS[status] ?? 'border-border bg-background text-foreground';
  return size === 'sm'
    ? `h-8 shrink-0 gap-1 border px-2.5 text-xs font-semibold ${palette}`
    : `h-7 shrink-0 gap-0.5 border px-2 text-[10px] font-semibold ${palette}`;
}

function activateOrResumeAction(
  status: string,
  isActivating: boolean,
): { Icon: LucideIcon; label: string } {
  if (RESUME_FROM_STATUSES.has(status)) {
    return { Icon: RotateCcw, label: isActivating ? 'Resuming…' : 'Resume' };
  }
  return { Icon: PlayCircle, label: isActivating ? 'Activating…' : 'Activate' };
}

function hasManualStatusActions(subscription: Subscription): boolean {
  return (
    subscriptionCanActivateOrResume(subscription) ||
    subscriptionCanHold(subscription) ||
    subscriptionCanCancel(subscription)
  );
}

function SubscriptionStatusStaticChip({
  subscription,
  size,
}: {
  subscription: Subscription;
  size: 'xs' | 'sm';
}) {
  const statusMeta = getSubscriptionStatus(subscription.status);
  return (
    <StatusBadge
      label={statusMeta?.label ?? subscription.status}
      variant={statusMeta?.variant ?? 'default'}
      className={statusControlClass(subscription.status, size)}
    />
  );
}

export function SubscriptionGridStatusControl({
  subscription,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
  forceNestedBackdrop = false,
  size = 'xs',
}: SubscriptionGridStatusControlProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  if (!hasManualStatusActions(subscription)) {
    return <SubscriptionStatusStaticChip subscription={subscription} size={size} />;
  }
  const opLock = activatingId ?? cancellingId ?? holdingId;
  const isActivating = activatingId === subscription.id;
  const isCancelling = cancellingId === subscription.id;
  const isHolding = holdingId === subscription.id;
  const menu: StatusMenuProps = {
    subscription,
    size,
    isBusy: isActivating || isCancelling || isHolding,
    isLockedOut: Boolean(opLock && opLock !== subscription.id),
    isActivating,
    isCancelling,
    isHolding,
    onActivate,
    onOpenCancel: () => setCancelOpen(true),
    onOpenHold: () => setHoldOpen(true),
  };
  return (
    <>
      <SubscriptionStatusDropdown {...menu} />
      <SubscriptionStatusActionDialogs
        subscription={subscription}
        cancelOpen={cancelOpen}
        holdOpen={holdOpen}
        isCancelling={isCancelling}
        isHolding={isHolding}
        forceNestedBackdrop={forceNestedBackdrop}
        setCancelOpen={setCancelOpen}
        setHoldOpen={setHoldOpen}
        onCancel={onCancel}
        onHold={onHold}
      />
    </>
  );
}

async function confirmStatusAction(action: () => Promise<void>, close: () => void): Promise<void> {
  try {
    await action();
    close();
  } catch {
    /* Parent banner handles errors */
  }
}

function SubscriptionStatusActionDialogs({
  subscription,
  cancelOpen,
  holdOpen,
  isCancelling,
  isHolding,
  forceNestedBackdrop,
  setCancelOpen,
  setHoldOpen,
  onCancel,
  onHold,
}: {
  subscription: Subscription;
  cancelOpen: boolean;
  holdOpen: boolean;
  isCancelling: boolean;
  isHolding: boolean;
  forceNestedBackdrop: boolean;
  setCancelOpen: (open: boolean) => void;
  setHoldOpen: (open: boolean) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
}) {
  return (
    <>
      <SubscriptionCancelDialog
        subscription={cancelOpen ? subscription : null}
        open={cancelOpen}
        isSubmitting={isCancelling}
        onOpenChange={setCancelOpen}
        forceNestedBackdrop={forceNestedBackdrop}
        onConfirm={() =>
          confirmStatusAction(
            () => onCancel(subscription),
            () => setCancelOpen(false),
          )
        }
      />
      <SubscriptionHoldDialog
        subscription={holdOpen ? subscription : null}
        open={holdOpen}
        isSubmitting={isHolding}
        onOpenChange={setHoldOpen}
        forceNestedBackdrop={forceNestedBackdrop}
        onConfirm={() =>
          confirmStatusAction(
            () => onHold(subscription),
            () => setHoldOpen(false),
          )
        }
      />
    </>
  );
}

function SubscriptionStatusDropdown(props: StatusMenuProps) {
  const statusMeta = getSubscriptionStatus(props.subscription.status);
  const label = statusMeta?.label ?? props.subscription.status;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(triggerProps) => (
          <Button
            {...triggerProps}
            type="button"
            variant="outline"
            size={props.size}
            disabled={props.isBusy}
            className={statusControlClass(props.subscription.status, props.size)}
            onClick={(e) => {
              e.stopPropagation();
              triggerProps.onClick?.(e);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              triggerProps.onPointerDown?.(e);
            }}
          >
            {label}
            <ChevronDown size={props.size === 'sm' ? 14 : 12} aria-hidden />
          </Button>
        )}
      />
      <DropdownMenuContent
        align="end"
        className="min-w-[10rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <SubscriptionStatusMenuItems {...props} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubscriptionStatusMenuItems({
  subscription,
  isBusy,
  isLockedOut,
  isActivating,
  isCancelling,
  isHolding,
  onActivate,
  onOpenCancel,
  onOpenHold,
}: StatusMenuProps) {
  const showActivate = subscriptionCanActivateOrResume(subscription);
  const showHold = subscriptionCanHold(subscription);
  const showCancel = subscriptionCanCancel(subscription);
  const { Icon, label } = activateOrResumeAction(subscription.status, isActivating);
  const disabled = isLockedOut || isBusy;

  return (
    <>
      {showActivate ? (
        <DropdownMenuItem disabled={disabled} onClick={() => onActivate(subscription)}>
          <Icon size={14} className="mr-2" />
          {label}
        </DropdownMenuItem>
      ) : null}
      {showHold ? (
        <DropdownMenuItem disabled={disabled} onClick={onOpenHold}>
          <PauseCircle size={14} className="mr-2" />
          {isHolding ? 'Pausing…' : 'Pause'}
        </DropdownMenuItem>
      ) : null}
      {showCancel ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={disabled}
            className="text-destructive focus:text-destructive"
            onClick={onOpenCancel}
          >
            <XCircle size={14} className="mr-2" />
            {isCancelling ? 'Cancelling…' : 'Cancel'}
          </DropdownMenuItem>
        </>
      ) : null}
    </>
  );
}
