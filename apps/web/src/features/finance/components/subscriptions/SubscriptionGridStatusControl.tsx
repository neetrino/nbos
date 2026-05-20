'use client';

import { useState } from 'react';
import { ChevronDown, PauseCircle, PlayCircle, RotateCcw, XCircle } from 'lucide-react';
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

interface SubscriptionGridStatusControlProps {
  subscription: Subscription;
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
}

export function SubscriptionGridStatusControl({
  subscription,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
}: SubscriptionGridStatusControlProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);

  const statusMeta = getSubscriptionStatus(subscription.status);
  const label = statusMeta?.label ?? subscription.status;
  const opLock = activatingId ?? cancellingId ?? holdingId;
  const isLockedOut = Boolean(opLock && opLock !== subscription.id);
  const isActivating = activatingId === subscription.id;
  const isCancelling = cancellingId === subscription.id;
  const isHolding = holdingId === subscription.id;
  const isBusy = isActivating || isCancelling || isHolding;

  const showActivate = subscriptionCanActivateOrResume(subscription);
  const showHold = subscriptionCanHold(subscription);
  const showCancel = subscriptionCanCancel(subscription);
  const statusClass =
    STATUS_BUTTON_CLASS[subscription.status] ?? 'border-border bg-background text-foreground';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isBusy}
            className={`h-7 shrink-0 gap-0.5 border px-2 text-[10px] font-semibold ${statusClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            {label}
            <ChevronDown size={12} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[10rem]"
          onClick={(e) => e.stopPropagation()}
        >
          {showActivate ? (
            <DropdownMenuItem
              disabled={isLockedOut || isBusy}
              onSelect={() => onActivate(subscription)}
            >
              {subscription.status === 'ON_HOLD' ? (
                <RotateCcw size={14} className="mr-2" />
              ) : (
                <PlayCircle size={14} className="mr-2" />
              )}
              {subscription.status === 'ON_HOLD'
                ? isActivating
                  ? 'Resuming…'
                  : 'Resume'
                : isActivating
                  ? 'Activating…'
                  : 'Activate'}
            </DropdownMenuItem>
          ) : null}
          {showHold ? (
            <DropdownMenuItem disabled={isLockedOut || isBusy} onSelect={() => setHoldOpen(true)}>
              <PauseCircle size={14} className="mr-2" />
              {isHolding ? 'Pausing…' : 'Pause'}
            </DropdownMenuItem>
          ) : null}
          {showCancel ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isLockedOut || isBusy}
                className="text-destructive focus:text-destructive"
                onSelect={() => setCancelOpen(true)}
              >
                <XCircle size={14} className="mr-2" />
                {isCancelling ? 'Cancelling…' : 'Cancel'}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <SubscriptionCancelDialog
        subscription={cancelOpen ? subscription : null}
        open={cancelOpen}
        isSubmitting={isCancelling}
        onOpenChange={setCancelOpen}
        onConfirm={async () => {
          try {
            await onCancel(subscription);
            setCancelOpen(false);
          } catch {
            /* Parent banner handles errors */
          }
        }}
      />
      <SubscriptionHoldDialog
        subscription={holdOpen ? subscription : null}
        open={holdOpen}
        isSubmitting={isHolding}
        onOpenChange={setHoldOpen}
        onConfirm={async () => {
          try {
            await onHold(subscription);
            setHoldOpen(false);
          } catch {
            /* Parent banner handles errors */
          }
        }}
      />
    </>
  );
}
