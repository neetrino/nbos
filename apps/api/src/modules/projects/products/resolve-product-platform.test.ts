import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { resolveDealProductPlatform, resolveProductPlatform } from './resolve-product-platform';

describe('resolveProductPlatform', () => {
  it('leaves a code shop empty until a platform is chosen, and maps MOBILE_APP to APP', () => {
    expect(
      resolveProductPlatform({ productCategory: 'CODE', productType: 'ECOMMERCE' }),
    ).toBeNull();
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

  it('does not fill WEB once a code category is chosen', () => {
    expect(resolveDealProductPlatform({ productCategory: 'CODE' })).toBeNull();
  });

  it('leaves marketing without a platform', () => {
    expect(
      resolveDealProductPlatform({ productCategory: 'MARKETING', productType: 'SEO' }),
    ).toBeNull();
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
