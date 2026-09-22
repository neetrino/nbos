import { describe, expect, it, vi } from 'vitest';
import { findPublishedCoreId } from './match-published-core';

describe('findPublishedCoreId', () => {
  it('matches the newest published core of one product kind', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'core-shop' });

    await expect(
      findPublishedCoreId({ deliveryBaseProfileVersion: { findFirst } } as never, {
        productType: 'ECOMMERCE',
      }),
    ).resolves.toBe('core-shop');

    expect(findFirst.mock.calls[0]?.[0].where).toEqual({
      status: 'PUBLISHED',
      productType: 'ECOMMERCE',
    });
    expect(findFirst.mock.calls[0]?.[0].where).not.toHaveProperty('entityKind');
    expect(findFirst.mock.calls[0]?.[0].where).not.toHaveProperty('productCategory');
  });

  it('does not query when the product type is missing', async () => {
    const findFirst = vi.fn();
    await expect(
      findPublishedCoreId({ deliveryBaseProfileVersion: { findFirst } } as never, {
        productType: null,
      }),
    ).resolves.toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
