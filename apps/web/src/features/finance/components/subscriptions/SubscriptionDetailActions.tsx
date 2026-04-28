'use client';

import { useState } from 'react';
import { Handshake, PauseCircle, PlayCircle, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Subscription } from '@/lib/api/finance';
import { SubscriptionCancelDialog } from './SubscriptionCancelDialog';
import { SubscriptionHoldDialog } from './SubscriptionHoldDialog';
import { SubscriptionPartnerDialog } from './SubscriptionPartnerDialog';
import {
  subscriptionCanActivateOrResume,
  subscriptionCanCancel,
  subscriptionCanHold,
} from './subscription-action-eligibility';
import { useSubscriptionDetailMutations } from './use-subscription-detail-mutations';

interface SubscriptionDetailActionsProps {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
  onError: (message: string | null) => void;
}

export function SubscriptionDetailActions({
  subscription,
  onSubscriptionChange,
  onError,
}: SubscriptionDetailActionsProps) {
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);

  const { activatingId, cancellingId, holdingId, handleActivate, handleCancel, handleHold } =
    useSubscriptionDetailMutations(subscription, onSubscriptionChange, onError);

  const showActivateOrResume = subscriptionCanActivateOrResume(subscription);
  const showHold = subscriptionCanHold(subscription);
  const showCancel = subscriptionCanCancel(subscription);

  const isActivating = activatingId === subscription.id;
  const isCancelling = cancellingId === subscription.id;
  const isHolding = holdingId === subscription.id;
  const isBusy = isActivating || isCancelling || isHolding;

  const confirmCancel = async () => {
    try {
      await handleCancel();
      setCancelOpen(false);
    } catch {
      /* Error surfaced via onError; keep dialog open for retry. */
    }
  };

  const confirmHold = async () => {
    try {
      await handleHold();
      setHoldOpen(false);
    } catch {
      /* Error surfaced via onError; keep dialog open for retry. */
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => setPartnerOpen(true)}
        >
          <Handshake size={14} />
          Partner
        </Button>
        {showActivateOrResume ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => void handleActivate()}
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
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => setHoldOpen(true)}
          >
            <PauseCircle size={14} />
            {isHolding ? 'Pausing…' : 'Pause'}
          </Button>
        ) : null}
        {showCancel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 border-destructive/40"
            disabled={isBusy}
            onClick={() => setCancelOpen(true)}
          >
            <XCircle size={14} />
            {isCancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        ) : null}
      </div>

      <SubscriptionPartnerDialog
        subscription={subscription}
        open={partnerOpen}
        onOpenChange={setPartnerOpen}
        onSaved={(updated) => {
          onSubscriptionChange(updated);
          onError(null);
        }}
      />
      <SubscriptionCancelDialog
        subscription={subscription}
        open={cancelOpen}
        isSubmitting={Boolean(cancellingId && cancellingId === subscription.id)}
        onOpenChange={setCancelOpen}
        onConfirm={() => void confirmCancel()}
      />
      <SubscriptionHoldDialog
        subscription={subscription}
        open={holdOpen}
        isSubmitting={Boolean(holdingId && holdingId === subscription.id)}
        onOpenChange={setHoldOpen}
        onConfirm={() => void confirmHold()}
      />
    </>
  );
}
