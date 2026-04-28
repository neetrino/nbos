/** Must match `GET /finance/invoices?subscriptionId=` (InvoicesController). */
export const SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY = 'subscriptionId' as const;

export function subscriptionInvoicesDrilldownHref(subscriptionId: string): string {
  const q = new URLSearchParams({
    [SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY]: subscriptionId,
  });
  return `/finance/invoices?${q.toString()}`;
}
