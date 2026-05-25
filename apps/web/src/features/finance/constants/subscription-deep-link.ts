/** Open subscription detail sheet on `/finance/subscriptions` with this query. */
export const OPEN_SUBSCRIPTION_QUERY = 'openSubscription' as const;

/** Full-page workspace route (extended layout); sheet uses list URL + query instead. */
export function subscriptionWorkspaceHref(subscriptionId: string): string {
  return `/finance/subscriptions/${subscriptionId}`;
}

export function subscriptionsListWithOpenSubscriptionHref(subscriptionId: string): string {
  return `/finance/subscriptions?${OPEN_SUBSCRIPTION_QUERY}=${encodeURIComponent(subscriptionId)}`;
}
