import type { Subscription } from '@/lib/api/finance';

const CANCELLABLE_STATUSES = new Set(['PENDING', 'ACTIVE', 'ON_HOLD']);

const ACTIVATABLE_STATUSES = new Set(['PENDING', 'ON_HOLD', 'CANCELLED']);

export function subscriptionCanActivateOrResume(subscription: Subscription): boolean {
  return ACTIVATABLE_STATUSES.has(subscription.status);
}

export function subscriptionCanHold(subscription: Subscription): boolean {
  return subscription.status === 'ACTIVE';
}

export function subscriptionCanCancel(subscription: Subscription): boolean {
  return CANCELLABLE_STATUSES.has(subscription.status);
}
