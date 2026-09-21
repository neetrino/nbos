import { describe, expect, it } from 'vitest';
import {
  allowedProductPlatforms,
  coerceOptionalProductPlatform,
  coerceProductPlatform,
  defaultProductPlatform,
  isProductPlatform,
  PRODUCT_PLATFORMS,
} from './product-platform';

describe('product platform', () => {
  it('names the axis WEB / APP / DESKTOP and never MOBILE_APP', () => {
    expect(PRODUCT_PLATFORMS).toEqual(['WEB', 'APP', 'DESKTOP']);
    expect(isProductPlatform('APP')).toBe(true);
    expect(isProductPlatform('MOBILE_APP')).toBe(false);
  });

  it('keeps WordPress, Shopify and marketing on WEB', () => {
    expect(allowedProductPlatforms('WORDPRESS')).toEqual(['WEB']);
    expect(allowedProductPlatforms('SHOPIFY')).toEqual(['WEB']);
    expect(allowedProductPlatforms('MARKETING')).toEqual(['WEB']);
    expect(allowedProductPlatforms('CODE')).toEqual(['WEB', 'APP', 'DESKTOP']);
  });

  it('maps the legacy MOBILE_APP kind to platform APP, everything else to WEB', () => {
    expect(defaultProductPlatform('MOBILE_APP')).toBe('APP');
    expect(defaultProductPlatform('ECOMMERCE')).toBe('WEB');
    expect(defaultProductPlatform(null)).toBe('WEB');
  });

  it('lets a shop be an app without inventing a second type', () => {
    expect(
      coerceProductPlatform({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        requested: 'APP',
      }),
    ).toBe('APP');
  });

  it('rejects APP on a WordPress card rather than storing an illegal combo', () => {
    expect(
      coerceProductPlatform({
        productCategory: 'WORDPRESS',
        productType: 'ECOMMERCE',
        requested: 'APP',
      }),
    ).toBe('WEB');
  });

  it('stays empty on a deal that has not picked a category yet', () => {
    expect(coerceOptionalProductPlatform({ requested: 'APP' })).toBeNull();
  });

  it('drops a leftover APP when the category is cleared', () => {
    expect(
      coerceOptionalProductPlatform({
        productCategory: null,
        productType: 'ECOMMERCE',
        requested: 'APP',
      }),
    ).toBeNull();
  });
});
