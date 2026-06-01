import { describe, expect, it } from 'vitest';
import {
  isUnitEconomicsOrderOpen,
  orderDisplayLabel,
  productGroupForOrder,
} from './unit-economics-order.types';

describe('orderDisplayLabel', () => {
  it('uses deal name for outsource and maintenance orders', () => {
    const label = orderDisplayLabel({
      code: 'ORD-1',
      product: null,
      extension: null,
      deal: { name: 'SEO retainer', code: 'D-1', productType: 'SEO' },
    });
    expect(label).toBe('SEO retainer');
  });
});

describe('productGroupForOrder', () => {
  it('groups standalone outsource order under its own order id', () => {
    const group = productGroupForOrder({
      id: 'order-1',
      code: 'ORD-1',
      product: null,
      extension: null,
      deal: { name: 'Partner delivery', code: 'D-2', productType: null },
    });
    expect(group.productGroupId).toBe('order-1');
    expect(group.productGroupName).toBe('Partner delivery');
  });
});

describe('isUnitEconomicsOrderOpen', () => {
  it('treats closed order status as closed for maintenance', () => {
    expect(isUnitEconomicsOrderOpen('MAINTENANCE', 'CLOSED')).toBe(false);
    expect(isUnitEconomicsOrderOpen('MAINTENANCE', 'ACTIVE')).toBe(true);
  });
});
