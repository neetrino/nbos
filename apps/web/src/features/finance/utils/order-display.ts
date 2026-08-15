import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';
import {
  getSubscriptionDisplayTitle,
  type SubscriptionDisplaySource,
} from '@/features/finance/utils/subscription-display';

export type OrderDealSummary = {
  name: string | null;
  code: string;
};

export type OrderWithOptionalDeal = {
  code: string;
  deal?: OrderDealSummary | null;
};

/** Human-readable order label — deal name when the order originated from a deal. */
export function getOrderDisplayTitle(order: OrderWithOptionalDeal): string {
  if (order.deal) {
    return getDealDisplayTitle(order.deal);
  }
  return order.code;
}

export type InvoiceDisplaySource = {
  code: string;
  order?: OrderWithOptionalDeal | null;
  subscription?: SubscriptionDisplaySource | null;
};

/**
 * Primary invoice title — order deal name, else subscription name, else invoice code.
 * Invoice code stays secondary in the UI when it is not the title.
 */
export function getInvoiceDisplayTitle(invoice: InvoiceDisplaySource): string {
  if (invoice.order) {
    return getOrderDisplayTitle(invoice.order);
  }
  if (invoice.subscription) {
    return getSubscriptionDisplayTitle(invoice.subscription);
  }
  return invoice.code;
}

/** Secondary invoice line — code when it is not already the primary title. */
export function getInvoiceDisplaySubtitle(invoice: InvoiceDisplaySource): string | undefined {
  const title = getInvoiceDisplayTitle(invoice);
  return title !== invoice.code ? invoice.code : undefined;
}

export function getInvoiceDealTitle(
  order: { deal?: OrderDealSummary | null } | null | undefined,
): string | null {
  if (!order?.deal) return null;
  return getDealDisplayTitle(order.deal);
}
