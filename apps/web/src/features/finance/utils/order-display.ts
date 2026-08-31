import {
  resolveInvoiceDisplaySubtitle,
  resolveInvoiceDisplayTitle,
  resolveOrderDisplayTitle,
  type InvoiceDisplayTitleSource,
} from '@nbos/shared';
import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';

export type OrderDealSummary = {
  name: string | null;
  code: string;
  type?: string | null;
};

export type OrderWithOptionalDeal = {
  code: string;
  deal?: OrderDealSummary | null;
};

export type InvoiceDisplaySource = InvoiceDisplayTitleSource;

/** Human-readable order label — deal name when the order originated from a deal. */
export function getOrderDisplayTitle(order: OrderWithOptionalDeal): string {
  return resolveOrderDisplayTitle(order);
}

/**
 * Primary invoice title — order deal name, else subscription name, else invoice code.
 * Invoice code stays secondary in the UI when it is not the title.
 */
export function getInvoiceDisplayTitle(invoice: InvoiceDisplaySource): string {
  return resolveInvoiceDisplayTitle(invoice);
}

/** Secondary invoice line — code when it is not already the primary title. */
export function getInvoiceDisplaySubtitle(invoice: InvoiceDisplaySource): string | undefined {
  return resolveInvoiceDisplaySubtitle(invoice);
}

export function getInvoiceDealTitle(
  order: { deal?: OrderDealSummary | null } | null | undefined,
): string | null {
  if (!order?.deal) return null;
  return getDealDisplayTitle(order.deal);
}
