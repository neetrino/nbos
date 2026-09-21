import { describe, expect, it, vi } from 'vitest';
import { findPublishedCoreId, pickPublishedCoreId } from './match-published-core';

describe('findPublishedCoreId', () => {
  it('matches a published core by kind and product type only', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'core-shop', productType: 'ECOMMERCE', productCategory: 'CODE' }]);

    await expect(
      findPublishedCoreId({ deliveryBaseProfileVersion: { findMany } } as never, {
        productType: 'ECOMMERCE',
        productCategory: 'CODE',
      }),
    ).resolves.toBe('core-shop');

    expect(findMany.mock.calls[0]?.[0].where).toEqual({
      status: 'PUBLISHED',
      entityKind: 'PRODUCT',
      OR: [{ productType: null }, { productType: 'ECOMMERCE' }],
    });
    expect(findMany.mock.calls[0]?.[0].where).not.toHaveProperty('implementationBase');
    expect(findMany.mock.calls[0]?.[0].where).not.toHaveProperty('designMode');
    expect(findMany.mock.calls[0]?.[0].where).not.toHaveProperty('aiDesignerReview');
  });
});

describe('pickPublishedCoreId', () => {
  const lookup = { productType: 'ECOMMERCE', productCategory: 'CODE' };

  it('prefers an exact type and category over a newer wildcard category', () => {
    expect(
      pickPublishedCoreId(
        [
          { id: 'newer-wildcard', productType: 'ECOMMERCE', productCategory: null },
          { id: 'exact', productType: 'ECOMMERCE', productCategory: 'CODE' },
        ],
        lookup,
      ),
    ).toBe('exact');
  });

  it('uses the newer row when specificity is equal', () => {
    expect(
      pickPublishedCoreId(
        [
          { id: 'newer', productType: 'ECOMMERCE', productCategory: 'CODE' },
          { id: 'older', productType: 'ECOMMERCE', productCategory: 'CODE' },
        ],
        lookup,
      ),
    ).toBe('newer');
  });
});
