import { PauseCircle, PlayCircle, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import type { Subscription } from '@/lib/api/finance';
import {
  subscriptionCanActivateOrResume,
  subscriptionCanCancel,
  subscriptionCanHold,
} from './subscription-action-eligibility';

export function SubscriptionTableActionCell({
  subscription,
  isLockedOut,
  isActivating,
  isCancelling,
  isHolding,
  onActivate,
  onOpenCancelDialog,
  onOpenHoldDialog,
}: {
  subscription: Subscription;
  isLockedOut: boolean;
  isActivating: boolean;
  isCancelling: boolean;
  isHolding: boolean;
  onActivate: (subscription: Subscription) => void;
  onOpenCancelDialog: () => void;
  onOpenHoldDialog: () => void;
}) {
  const showActivateOrResume = subscriptionCanActivateOrResume(subscription);
  const showHold = subscriptionCanHold(subscription);
  const showCancel = subscriptionCanCancel(subscription);

  if (!showActivateOrResume && !showHold && !showCancel) {
    return (
      <TableCell className="text-muted-foreground text-right text-xs">
        <span aria-hidden>—</span>
      </TableCell>
    );
  }

  return (
    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {showActivateOrResume ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isLockedOut || isActivating || isCancelling || isHolding}
            onClick={() => onActivate(subscription)}
          >
            {subscription.status === 'ON_HOLD' ? <RotateCcw size={14} /> : <PlayCircle size={14} />}
            {subscription.status === 'ON_HOLD'
              ? isActivating
                ? 'Resuming…'
                : 'Resume'
              : isActivating
                ? 'Activating…'
                : 'Activate'}
          </Button>
        ) : null}
        {showHold ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isLockedOut || isActivating || isCancelling || isHolding}
            onClick={onOpenHoldDialog}
          >
            <PauseCircle size={14} />
            {isHolding ? 'Pausing…' : 'Pause'}
          </Button>
        ) : null}
        {showCancel ? (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/40"
            disabled={isLockedOut || isActivating || isCancelling || isHolding}
            onClick={onOpenCancelDialog}
          >
            <XCircle size={14} />
            {isCancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        ) : null}
      </div>
    </TableCell>
  );
}
