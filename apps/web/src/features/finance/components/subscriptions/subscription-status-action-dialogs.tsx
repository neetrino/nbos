'use client';

import type { Subscription } from '@/lib/api/finance';
import { SubscriptionCancelDialog } from './SubscriptionCancelDialog';
import { SubscriptionHoldDialog } from './SubscriptionHoldDialog';

export async function confirmStatusAction(
  action: () => Promise<void>,
  close: () => void,
): Promise<void> {
  try {
    await action();
    close();
  } catch {
    /* Parent banner handles errors */
  }
}

export function SubscriptionStatusActionDialogs({
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
