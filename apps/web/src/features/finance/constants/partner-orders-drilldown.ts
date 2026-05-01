/** Must match `GET /finance/orders?partnerId=` (OrdersController). */
export const PARTNER_ORDERS_DRILLDOWN_QUERY = 'partnerId' as const;

export function partnerOrdersDrilldownHref(partnerId: string): string {
  const q = new URLSearchParams({
    [PARTNER_ORDERS_DRILLDOWN_QUERY]: partnerId,
  });
  return `/finance/orders?${q.toString()}`;
}
