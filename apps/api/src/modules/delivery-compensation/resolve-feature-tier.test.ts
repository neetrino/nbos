import { describe, expect, it } from 'vitest';
import { resolveFeatureTierId } from './resolve-feature-tier';

const SITE_TIER = {
  id: 'tier-site',
  position: 1,
  productTypes: [{ productType: 'LANDING' }, { productType: 'COMPANY_WEBSITE' }],
};
const SHOP_TIER = { id: 'tier-shop', position: 2, productTypes: [{ productType: 'ECOMMERCE' }] };
const SYSTEM_TIER = {
  id: 'tier-system',
  position: 3,
  productTypes: [{ productType: 'CRM' }, { productType: 'ERP' }],
};
const TIERS = [SITE_TIER, SHOP_TIER, SYSTEM_TIER];

function tierRequired() {
  return expect.objectContaining({
    response: expect.objectContaining({ code: 'FUNCTION_TIER_REQUIRED' }),
  });
}

describe('resolveFeatureTierId', () => {
  it('resolves the gradation from the product being sold', () => {
    expect(resolveFeatureTierId({ tiers: TIERS, productType: 'LANDING' })).toBe('tier-site');
    expect(resolveFeatureTierId({ tiers: TIERS, productType: 'ECOMMERCE' })).toBe('tier-shop');
    expect(resolveFeatureTierId({ tiers: TIERS, productType: 'CRM' })).toBe('tier-system');
  });

  it('keeps a function without gradations unchanged', () => {
    expect(resolveFeatureTierId({ tiers: [], productType: 'ECOMMERCE' })).toBeNull();
  });

  it('honours an explicit override of the resolved gradation', () => {
    expect(
      resolveFeatureTierId({
        tiers: TIERS,
        productType: 'LANDING',
        requestedTierId: 'tier-system',
      }),
    ).toBe('tier-system');
  });

  it('refuses a gradation that belongs to another function', () => {
    expect(() =>
      resolveFeatureTierId({ tiers: TIERS, productType: 'CRM', requestedTierId: 'tier-elsewhere' }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'FUNCTION_TIER_UNKNOWN' }),
      }),
    );
  });

  it('refuses a gradation on a function that has none', () => {
    expect(() =>
      resolveFeatureTierId({ tiers: [], productType: 'CRM', requestedTierId: 'tier-system' }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'FUNCTION_TIER_UNKNOWN' }),
      }),
    );
  });

  it('asks for an explicit gradation when the product type maps to none', () => {
    expect(() => resolveFeatureTierId({ tiers: TIERS, productType: 'SEO' })).toThrow(
      tierRequired(),
    );
  });

  it('asks for an explicit gradation when the product type is unknown', () => {
    expect(() => resolveFeatureTierId({ tiers: TIERS, productType: null })).toThrow(tierRequired());
  });

  it('refuses to guess when the catalog maps two gradations to one product type', () => {
    const ambiguous = [
      SHOP_TIER,
      { id: 'tier-duplicate', position: 4, productTypes: [{ productType: 'ECOMMERCE' }] },
    ];
    expect(() => resolveFeatureTierId({ tiers: ambiguous, productType: 'ECOMMERCE' })).toThrow(
      tierRequired(),
    );
  });
});
