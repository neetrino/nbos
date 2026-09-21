import { describe, expect, it } from 'vitest';
import { dealProductPlatformWrite } from './deal-product-platform-write';

const codeShop = {
  productCategory: 'CODE',
  productType: 'ECOMMERCE',
  productPlatform: 'APP',
};

describe('dealProductPlatformWrite', () => {
  it('leaves notes-only patches alone', () => {
    expect(dealProductPlatformWrite({}, codeShop)).toEqual({});
  });

  it('keeps APP on a code shop when platform is omitted from the patch', () => {
    expect(dealProductPlatformWrite({ productType: 'ECOMMERCE' }, codeShop)).toEqual({
      productPlatform: 'APP',
    });
  });

  it('forces WEB when the category becomes WordPress', () => {
    expect(dealProductPlatformWrite({ productCategory: 'WORDPRESS' }, codeShop)).toEqual({
      productPlatform: 'WEB',
    });
  });

  it('clears platform when taxonomy is cleared', () => {
    expect(
      dealProductPlatformWrite(
        { productCategory: null, productType: null, productPlatform: null },
        codeShop,
      ),
    ).toEqual({ productPlatform: null });
  });

  it('does not keep APP after a partial patch that only clears category', () => {
    expect(dealProductPlatformWrite({ productCategory: null }, codeShop)).toEqual({
      productPlatform: null,
    });
  });

  it('clears platform when the category becomes marketing', () => {
    expect(dealProductPlatformWrite({ productCategory: 'MARKETING' }, codeShop)).toEqual({
      productPlatform: null,
    });
  });
});
