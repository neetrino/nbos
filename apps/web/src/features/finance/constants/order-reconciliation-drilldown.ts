export const ORDER_RECONCILIATION_GAP_QUERY = 'gap';

/** Larger window when drilling down from dashboard so filtering stays useful. */
export const ORDER_RECONCILIATION_DRILLDOWN_PAGE_SIZE = 500;

export const ORDER_RECONCILIATION_GAP = {
  UNINVOICED: 'uninvoiced',
  OUTSTANDING: 'outstanding',
} as const;

export type OrderReconciliationGap =
  (typeof ORDER_RECONCILIATION_GAP)[keyof typeof ORDER_RECONCILIATION_GAP];

const RECONCILIATION_EPSILON = 0.005;

export function parseOrderReconciliationGap(raw: string | null): OrderReconciliationGap | null {
  if (raw === ORDER_RECONCILIATION_GAP.UNINVOICED || raw === ORDER_RECONCILIATION_GAP.OUTSTANDING) {
    return raw;
  }
  return null;
}

export function orderReconciliationDrilldownHref(gap: OrderReconciliationGap): string {
  return `/finance/orders?${ORDER_RECONCILIATION_GAP_QUERY}=${gap}`;
}

export function orderReconciliationGapForFinanceWarningCode(
  code: 'UNINVOICED_ORDERS' | 'OUTSTANDING_ORDERS',
): OrderReconciliationGap {
  return code === 'UNINVOICED_ORDERS'
    ? ORDER_RECONCILIATION_GAP.UNINVOICED
    : ORDER_RECONCILIATION_GAP.OUTSTANDING;
}

interface OrderWithReconciliationAmounts {
  reconciliation?: {
    uninvoicedAmount: number;
    outstandingAmount: number;
  };
}

export function filterOrdersByReconciliationGap<T extends OrderWithReconciliationAmounts>(
  orders: T[],
  gap: OrderReconciliationGap,
): T[] {
  return orders.filter((order) => {
    const rec = order.reconciliation;
    if (!rec) return false;
    if (gap === ORDER_RECONCILIATION_GAP.UNINVOICED) {
      return rec.uninvoicedAmount > RECONCILIATION_EPSILON;
    }
    return rec.outstandingAmount > RECONCILIATION_EPSILON;
  });
}
