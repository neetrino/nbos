import { describe, expect, it } from 'vitest';
import { canShowDealConstructor } from './can-show-deal-constructor';

describe('canShowDealConstructor', () => {
  it('shows only on a product deal that still has no product', () => {
    expect(
      canShowDealConstructor({
        type: 'PRODUCT',
        productType: 'ECOMMERCE',
        existingProductId: null,
      }),
    ).toBe(true);
  });

  it('hides a won deal, extension deals, missing type, or an already created product', () => {
    expect(
      canShowDealConstructor({
        type: 'PRODUCT',
        status: 'WON',
        productType: 'ECOMMERCE',
        existingProductId: null,
      }),
    ).toBe(false);
    expect(
      canShowDealConstructor({
        type: 'EXTENSION',
        productType: 'ECOMMERCE',
        existingProductId: null,
      }),
    ).toBe(false);
    expect(
      canShowDealConstructor({ type: 'PRODUCT', productType: null, existingProductId: null }),
    ).toBe(false);
    expect(
      canShowDealConstructor({
        type: 'PRODUCT',
        productType: 'ECOMMERCE',
        existingProductId: 'prod-1',
      }),
    ).toBe(false);
    expect(
      canShowDealConstructor({
        type: 'PRODUCT',
        productType: 'ECOMMERCE',
        existingProductId: null,
        handoff: { product: { id: 'prod-1' } },
      }),
    ).toBe(false);
  });
});
