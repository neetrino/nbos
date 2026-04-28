import { describe, expect, it } from 'vitest';
import {
  ORDER_RECONCILIATION_GAP,
  filterOrdersByReconciliationGap,
  parseOrderReconciliationGap,
} from './order-reconciliation-drilldown';

describe('order reconciliation drilldown', () => {
  it('parses known gap query values', () => {
    expect(parseOrderReconciliationGap('uninvoiced')).toBe(ORDER_RECONCILIATION_GAP.UNINVOICED);
    expect(parseOrderReconciliationGap('outstanding')).toBe(ORDER_RECONCILIATION_GAP.OUTSTANDING);
    expect(parseOrderReconciliationGap(null)).toBeNull();
    expect(parseOrderReconciliationGap('other')).toBeNull();
  });

  it('filters orders by uninvoiced or outstanding reconciliation gaps', () => {
    const orders = [
      {
        id: 'a',
        reconciliation: { uninvoicedAmount: 100, outstandingAmount: 0 },
      },
      {
        id: 'b',
        reconciliation: { uninvoicedAmount: 0, outstandingAmount: 50 },
      },
      { id: 'c', reconciliation: { uninvoicedAmount: 0, outstandingAmount: 0 } },
    ];

    expect(filterOrdersByReconciliationGap(orders, ORDER_RECONCILIATION_GAP.UNINVOICED)).toEqual([
      orders[0],
    ]);
    expect(filterOrdersByReconciliationGap(orders, ORDER_RECONCILIATION_GAP.OUTSTANDING)).toEqual([
      orders[1],
    ]);
  });
});
