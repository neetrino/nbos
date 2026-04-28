/** Must match `GET /finance/subscriptions?partnerId=` (SubscriptionsController). */
export const PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY = 'partnerId' as const;

export function partnerSubscriptionsDrilldownHref(partnerId: string): string {
  const q = new URLSearchParams({
    [PARTNER_SUBSCRIPTIONS_DRILLDOWN_QUERY]: partnerId,
  });
  return `/finance/subscriptions?${q.toString()}`;
}
