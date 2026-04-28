import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import type { Subscription } from '@/lib/api/finance';

/** Whether a subscription row belongs to the same partner scope as subscription stats (list API query). */
export function subscriptionMatchesPartnerStatsScope(
  subscription: Subscription,
  scopePartnerId: string | undefined,
): boolean {
  if (scopePartnerId === undefined) return true;
  if (scopePartnerId === SUBSCRIPTION_PARTNER_FILTER_UNLINKED) {
    return subscription.partner == null;
  }
  return subscription.partner?.id === scopePartnerId;
}
