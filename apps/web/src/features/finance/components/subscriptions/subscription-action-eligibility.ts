import type { Subscription } from '@/lib/api/finance';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'ACTIVE', 'ON_HOLD']);

export function subscriptionCanActivateOrResume(subscription: Subscription): boolean {
  return subscription.status === 'PENDING' || subscription.status === 'ON_HOLD';
}

export function subscriptionCanHold(subscription: Subscription): boolean {
  return subscription.status === 'ACTIVE';
}

export function subscriptionCanCancel(subscription: Subscription): boolean {
  return CANCELLABLE_STATUSES.has(subscription.status);
}
