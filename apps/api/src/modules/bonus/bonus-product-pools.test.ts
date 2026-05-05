import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';
import {
  foldBonusProductPools,
  type BonusOrderPoolGroupRow,
  type OrderForBonusPool,
} from './bonus-product-pools';

describe('foldBonusProductPools', () => {
  const order: OrderForBonusPool = {
    id: 'o1',
    code: 'ORD-1',
    projectId: 'p1',
    productId: 'prod1',
    extensionId: null,
    project: { id: 'p1', code: 'PR-1', name: 'Alpha' },
    product: { id: 'prod1', name: 'Website' },
    extension: null,
  };

  it('aggregates statuses into one product pool', () => {
    const orderGroups: BonusOrderPoolGroupRow[] = [
      { orderId: 'o1', status: 'ACTIVE', _sum: { amount: new Decimal('100') }, _count: 2 },
      { orderId: 'o1', status: 'PAID', _sum: { amount: new Decimal('50') }, _count: 1 },
    ];
    const rows = foldBonusProductPools(orderGroups, [order]);
    expect(rows).toHaveLength(1);
    expect(rows[0].poolKey).toBe('product:prod1');
    expect(rows[0].anchorOrderId).toBe('o1');
    expect(rows[0].entryCount).toBe(3);
    expect(rows[0].sumPipelineAmount).toBe('100.00');
    expect(rows[0].sumPaidAmount).toBe('50.00');
    expect(rows[0].sumTotalAmount).toBe('150.00');
  });

  it('uses extension pool when no product on order', () => {
    const extOrder: OrderForBonusPool = {
      id: 'o2',
      code: 'ORD-2',
      projectId: 'p1',
      productId: null,
      extensionId: 'ex1',
      project: { id: 'p1', code: 'PR-1', name: 'Alpha' },
      product: null,
      extension: { id: 'ex1', name: 'Add-on' },
    };
    const orderGroups: BonusOrderPoolGroupRow[] = [
      { orderId: 'o2', status: 'INCOMING', _sum: { amount: new Decimal('10') }, _count: 1 },
    ];
    const rows = foldBonusProductPools(orderGroups, [extOrder]);
    expect(rows[0].poolKey).toBe('extension:ex1');
    expect(rows[0].poolKind).toBe('EXTENSION');
  });
});
