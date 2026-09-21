import { describe, expect, it } from 'vitest';
import { buildProductTaxonomyPatch } from './product-write-data';

describe('buildProductTaxonomyPatch', () => {
  it('coerces APP to WEB when the category becomes WordPress', () => {
    expect(
      buildProductTaxonomyPatch(
        { productCategory: 'WORDPRESS' },
        { productCategory: 'CODE', productType: 'ECOMMERCE', productPlatform: 'APP' },
      ),
    ).toEqual({
      productCategory: 'WORDPRESS',
      productType: 'ECOMMERCE',
      productPlatform: 'WEB',
    });
  });
});
