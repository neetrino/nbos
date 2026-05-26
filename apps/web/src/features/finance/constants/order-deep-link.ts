/** Open order detail sheet on `/finance/orders` with this query. */
export const OPEN_ORDER_QUERY = 'openOrder' as const;

export function ordersListWithOpenOrderHref(orderId: string): string {
  return `/finance/orders?${OPEN_ORDER_QUERY}=${encodeURIComponent(orderId)}`;
}
