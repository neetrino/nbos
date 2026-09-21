import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { resolveDealProductPlatform, resolveProductPlatform } from './resolve-product-platform';

describe('resolveProductPlatform', () => {
  it('defaults a code shop to WEB and a legacy MOBILE_APP kind to APP', () => {
    expect(resolveProductPlatform({ productCategory: 'CODE', productType: 'ECOMMERCE' })).toBe(
      'WEB',
    );
    expect(resolveProductPlatform({ productCategory: 'CODE', productType: 'MOBILE_APP' })).toBe(
      'APP',
    );
  });

  it('keeps an explicit APP on a code product', () => {
    expect(
      resolveProductPlatform({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        requested: 'APP',
      }),
    ).toBe('APP');
  });

  it('rejects a string that is not WEB, APP or DESKTOP', () => {
    expect(() =>
      resolveProductPlatform({
        productCategory: 'CODE',
        productType: 'ECOMMERCE',
        requested: 'MOBILE_APP',
      }),
    ).toThrow(BadRequestException);
  });
});

describe('resolveDealProductPlatform', () => {
  it('stays empty until the deal has a category', () => {
    expect(resolveDealProductPlatform({})).toBeNull();
  });

  it('fills WEB once a category is chosen', () => {
    expect(resolveDealProductPlatform({ productCategory: 'CODE' })).toBe('WEB');
  });

  it('does not keep APP after the category is cleared', () => {
    expect(
      resolveDealProductPlatform({
        productCategory: null,
        productType: 'ECOMMERCE',
        requested: 'APP',
      }),
    ).toBeNull();
  });
});
