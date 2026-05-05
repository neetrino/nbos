import { SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY } from './subscription-invoice-drilldown';

/** Open Invoice Card sheet when landing on `/finance/invoices` with this query. */
export const OPEN_INVOICE_QUERY = 'openInvoice' as const;

export function openInvoiceWithSubscriptionHref(subscriptionId: string, invoiceId: string): string {
  const q = new URLSearchParams({
    [SUBSCRIPTION_INVOICES_DRILLDOWN_QUERY]: subscriptionId,
    [OPEN_INVOICE_QUERY]: invoiceId,
  });
  return `/finance/invoices?${q.toString()}`;
}
