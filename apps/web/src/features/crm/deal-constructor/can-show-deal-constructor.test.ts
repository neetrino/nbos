import { describe, expect, it } from 'vitest';
import { canShowDealConstructor, isDealCompositionReady } from './can-show-deal-constructor';

describe('canShowDealConstructor', () => {
  it('shows the card on a product deal even before type is chosen', () => {
    expect(canShowDealConstructor({ type: 'PRODUCT', existingProductId: null })).toBe(true);
  });

  it('hides a won deal, extension deals, or an already created product', () => {
    expect(
      canShowDealConstructor({ type: 'PRODUCT', status: 'WON', existingProductId: null }),
    ).toBe(false);
    expect(canShowDealConstructor({ type: 'EXTENSION', existingProductId: null })).toBe(false);
    expect(canShowDealConstructor({ type: 'PRODUCT', existingProductId: 'prod-1' })).toBe(false);
    expect(
      canShowDealConstructor({
        type: 'PRODUCT',
        existingProductId: null,
        handoff: { product: { id: 'prod-1' } },
      }),
    ).toBe(false);
  });
});

describe('isDealCompositionReady', () => {
  it('stays disabled on Code until both type and platform exist', () => {
    expect(
      isDealCompositionReady({
        productCategory: 'CODE',
        productType: null,
        productPlatform: null,
      }),
    ).toBe(false);
    expect(
      isDealCompositionReady({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        productPlatform: null,
      }),
    ).toBe(false);
    expect(
      isDealCompositionReady({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        productPlatform: 'WEB',
      }),
    ).toBe(true);
  });

  it('does not wait for a platform on marketing', () => {
    expect(
      isDealCompositionReady({
        productCategory: 'MARKETING',
        productType: 'SEO',
        productPlatform: null,
      }),
    ).toBe(true);
  });
});
