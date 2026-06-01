import { getDealDisplayTitle } from '@/features/crm/utils/crm-entity-display';

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

export function getInvoiceDealTitle(
  order: { deal?: OrderDealSummary | null } | null | undefined,
): string | null {
  if (!order?.deal) return null;
  return getDealDisplayTitle(order.deal);
}
