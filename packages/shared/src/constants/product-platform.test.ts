import { describe, expect, it } from 'vitest';
import {
  allowedProductPlatforms,
  CODE_SITE_PRODUCT_TYPES,
  coerceOptionalProductPlatform,
  coerceProductPlatform,
  defaultProductPlatform,
  isProductPlatform,
  keepProductTypeAfterPlatformChange,
  listedProductTypesForActiveOptions,
  listedProductTypesForPicker,
  OFFERED_CODE_PRODUCT_TYPES,
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
  it('offers sites only on Code WEB; App is thinner; Desktop is thinnest', () => {
    const web = listedProductTypesForPicker('CODE', null, 'WEB');
    const app = listedProductTypesForPicker('CODE', null, 'APP');
    const desktop = listedProductTypesForPicker('CODE', null, 'DESKTOP');

    expect(web).toEqual(expect.arrayContaining([...CODE_SITE_PRODUCT_TYPES, 'ECOMMERCE', 'BOS']));
    expect(web).not.toContain('POS');
    expect(web).not.toContain('MOBILE_APP');
    expect(web).not.toContain('SAAS');

    expect(app).toEqual(expect.arrayContaining(['ECOMMERCE', 'POS', 'CRM', 'BOS', 'WEB_APP']));
    expect(app).not.toContain('LANDING');
    expect(app).not.toContain('BLOG');

    expect(desktop).toEqual(expect.arrayContaining(['POS', 'CRM', 'ERP', 'BOS', 'WEB_APP']));
    expect(desktop).not.toContain('ECOMMERCE');
    expect(desktop).not.toContain('LMS');
    expect(desktop).not.toContain('CUSTOMER_PORTAL');
    expect(web.length).toBeGreaterThan(app.length);
    expect(app.length).toBeGreaterThan(desktop.length);
    expect(OFFERED_CODE_PRODUCT_TYPES).toHaveLength(29);
  });

  it('waits for a Code platform before offering types', () => {
    expect(listedProductTypesForPicker('CODE')).toEqual([]);
  });

  it('keeps a legacy site type visible on APP until the value changes', () => {
    expect(listedProductTypesForPicker('CODE', 'LANDING', 'APP')).toContain('LANDING');
    expect(keepProductTypeAfterPlatformChange('CODE', 'LANDING', 'APP')).toBeNull();
    expect(keepProductTypeAfterPlatformChange('CODE', 'ECOMMERCE', 'APP')).toBe('ECOMMERCE');
  });

  it('intersects the picker with active system-list options and keeps the current value', () => {
    expect(listedProductTypesForActiveOptions(['LMS', 'BOS'], ['BOS'], null)).toEqual(['BOS']);
    expect(listedProductTypesForActiveOptions(['LMS', 'BOS'], ['BOS'], 'LMS')).toEqual([
      'LMS',
      'BOS',
    ]);
    expect(listedProductTypesForActiveOptions(['LMS', 'BOS'], null, null)).toEqual(['LMS', 'BOS']);
  });

  it('rejects a site on APP and a new MOBILE_APP or SAAS pick, and keeps legacy pairs', () => {
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
        { allowLegacyHiddenType: true, currentProductType: 'MOBILE_APP' },
      ),
    ).toBeNull();
    expect(
      productTypePlatformPairError(
        {
          productCategory: 'CODE',
          productType: 'SAAS',
          productPlatform: 'WEB',
        },
        { allowLegacyHiddenType: true, currentProductType: 'SAAS' },
      ),
    ).toBeNull();
    expect(
      productTypePlatformPairError(
        {
          productCategory: 'CODE',
          productType: 'MOBILE_APP',
          productPlatform: 'APP',
        },
        { allowLegacyHiddenType: true, currentProductType: 'SAAS' },
      ),
    ).toBe(PRODUCT_TYPE_PLATFORM_MISMATCH);
    expect(
      productTypePlatformPairError({
        productCategory: 'CODE',
        productType: 'SAAS',
        productPlatform: 'WEB',
      }),
    ).toBe(PRODUCT_TYPE_PLATFORM_MISMATCH);
    expect(
      productTypePlatformPairError({
        productCategory: 'CODE',
        productType: 'WEB_APP',
        productPlatform: 'DESKTOP',
      }),
    ).toBeNull();
  });
});
