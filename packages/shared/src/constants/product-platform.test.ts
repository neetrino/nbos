import { describe, expect, it } from 'vitest';
import {
  allowedProductPlatforms,
  CODE_CROSS_PLATFORM_PRODUCT_TYPES,
  CODE_SITE_PRODUCT_TYPES,
  coerceOptionalProductPlatform,
  coerceProductPlatform,
  defaultProductPlatform,
  isProductPlatform,
  keepProductTypeAfterPlatformChange,
  listedProductTypesForPicker,
  productPlatformApplies,
  productPlatformPickerApplies,
  PRODUCT_TYPE_PLATFORM_MISMATCH,
  productTypeFieldReady,
  productTypePlatformPairError,
  PRODUCT_PLATFORMS,
} from './product-platform';

describe('product platform', () => {
  it('names the axis WEB / APP / DESKTOP and never MOBILE_APP', () => {
    expect(PRODUCT_PLATFORMS).toEqual(['WEB', 'APP', 'DESKTOP']);
    expect(isProductPlatform('APP')).toBe(true);
    expect(isProductPlatform('MOBILE_APP')).toBe(false);
  });

  it('keeps WordPress and Shopify on WEB and leaves marketing without a platform', () => {
    expect(productPlatformApplies('CODE')).toBe(true);
    expect(productPlatformApplies('WORDPRESS')).toBe(true);
    expect(productPlatformApplies('MARKETING')).toBe(false);
    expect(allowedProductPlatforms('WORDPRESS')).toEqual(['WEB']);
    expect(allowedProductPlatforms('SHOPIFY')).toEqual(['WEB']);
    expect(allowedProductPlatforms('MARKETING')).toEqual([]);
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

  it('does not invent WEB on a Code card until the seller picks a platform', () => {
    expect(
      coerceOptionalProductPlatform({ productCategory: 'CODE', productType: 'ECOMMERCE' }),
    ).toBe(null);
    expect(
      coerceOptionalProductPlatform({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        requested: 'WEB',
      }),
    ).toBe('WEB');
    expect(productTypeFieldReady({ productCategory: 'CODE', productPlatform: null })).toBe(false);
    expect(productTypeFieldReady({ productCategory: 'CODE', productPlatform: 'APP' })).toBe(true);
    expect(productTypeFieldReady({ productCategory: 'WORDPRESS', productPlatform: null })).toBe(
      true,
    );
    expect(productPlatformPickerApplies('CODE')).toBe(true);
    expect(productPlatformPickerApplies('WORDPRESS')).toBe(false);
    expect(productPlatformPickerApplies('MARKETING')).toBe(false);
  });

  it('does not stamp WEB onto a marketing deal', () => {
    expect(
      coerceOptionalProductPlatform({
        productCategory: 'MARKETING',
        productType: 'SEO',
        requested: 'WEB',
      }),
    ).toBeNull();
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

describe('product type by platform', () => {
  it('offers sites only on Code WEB and systems on every Code platform', () => {
    expect(listedProductTypesForPicker('CODE', null, 'WEB')).toEqual([
      ...CODE_SITE_PRODUCT_TYPES,
      ...CODE_CROSS_PLATFORM_PRODUCT_TYPES,
    ]);
    expect(listedProductTypesForPicker('CODE', null, 'APP')).toEqual([
      ...CODE_CROSS_PLATFORM_PRODUCT_TYPES,
    ]);
    expect(listedProductTypesForPicker('CODE', null, 'DESKTOP')).toEqual([
      ...CODE_CROSS_PLATFORM_PRODUCT_TYPES,
    ]);
    expect(listedProductTypesForPicker('CODE', null, 'APP')).not.toContain('LANDING');
    expect(listedProductTypesForPicker('CODE', null, 'APP')).toContain('WEB_APP');
  });

  it('waits for a Code platform before offering types', () => {
    expect(listedProductTypesForPicker('CODE')).toEqual([]);
  });

  it('keeps a legacy site type visible on APP until the value changes', () => {
    expect(listedProductTypesForPicker('CODE', 'LANDING', 'APP')).toContain('LANDING');
    expect(keepProductTypeAfterPlatformChange('CODE', 'LANDING', 'APP')).toBeNull();
    expect(keepProductTypeAfterPlatformChange('CODE', 'ECOMMERCE', 'APP')).toBe('ECOMMERCE');
  });

  it('rejects a site on APP and a new MOBILE_APP pick, and keeps a legacy mobile pair', () => {
    expect(
      productTypePlatformPairError({
        productCategory: 'CODE',
        productType: 'LANDING',
        productPlatform: 'APP',
      }),
    ).toBe(PRODUCT_TYPE_PLATFORM_MISMATCH);
    expect(
      productTypePlatformPairError({
        productCategory: 'CODE',
        productType: 'MOBILE_APP',
        productPlatform: 'APP',
      }),
    ).toBe(PRODUCT_TYPE_PLATFORM_MISMATCH);
    expect(
      productTypePlatformPairError(
        {
          productCategory: 'CODE',
          productType: 'MOBILE_APP',
          productPlatform: 'APP',
        },
        { allowLegacyMobileApp: true },
      ),
    ).toBeNull();
    expect(
      productTypePlatformPairError({
        productCategory: 'CODE',
        productType: 'WEB_APP',
        productPlatform: 'DESKTOP',
      }),
    ).toBeNull();
  });
});
