import { useCallback, useState } from 'react';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

export function useSubscriptionDetailMutations(
  subscription: Subscription,
  onSubscriptionChange: (updated: Subscription) => void,
  onError: (message: string | null) => void,
) {
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [holdingId, setHoldingId] = useState<string | null>(null);

  const handleActivate = useCallback(async () => {
    setActivatingId(subscription.id);
    onError(null);
    try {
      const updated = await subscriptionsApi.updateStatus(subscription.id, 'ACTIVE');
      onSubscriptionChange(updated);
    } catch {
      onError('Subscription could not be activated or resumed. Try again.');
    } finally {
      setActivatingId(null);
    }
  }, [subscription, onSubscriptionChange, onError]);

  const handleCancel = useCallback(async () => {
    setCancellingId(subscription.id);
    onError(null);
    try {
      const updated = await subscriptionsApi.updateStatus(subscription.id, 'CANCELLED');
      onSubscriptionChange(updated);
    } catch {
      onError('Subscription could not be cancelled. Try again.');
      throw new Error('subscription_cancel_failed');
    } finally {
      setCancellingId(null);
    }
  }, [subscription, onSubscriptionChange, onError]);

  const handleHold = useCallback(async () => {
    setHoldingId(subscription.id);
    onError(null);
    try {
      const updated = await subscriptionsApi.updateStatus(subscription.id, 'ON_HOLD');
      onSubscriptionChange(updated);
    } catch {
      onError('Subscription could not be put on hold. Try again.');
      throw new Error('subscription_hold_failed');
    } finally {
      setHoldingId(null);
    }
  }, [subscription, onSubscriptionChange, onError]);

  return {
    activatingId,
    cancellingId,
    holdingId,
    handleActivate,
    handleCancel,
    handleHold,
  };
}
