/** Open payment detail sheet on `/finance/payments` with this query. */
export const OPEN_PAYMENT_QUERY = 'openPayment' as const;

export function paymentsListWithOpenPaymentHref(paymentId: string): string {
  return `/finance/payments?${OPEN_PAYMENT_QUERY}=${encodeURIComponent(paymentId)}`;
}
