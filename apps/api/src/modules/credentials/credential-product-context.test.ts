import { describe, it, expect, vi } from 'vitest';
import {
  attachCredentialProducts,
  collectCredentialProductIds,
  mergeCredentialProducts,
} from './credential-product-context';

describe('collectCredentialProductIds', () => {
  it('returns unique non-empty product ids', () => {
    expect(
      collectCredentialProductIds([
        { productId: 'p1' },
        { productId: 'p1' },
        { productId: 'p2' },
        { productId: null },
        {},
      ]),
    ).toEqual(['p1', 'p2']);
  });
});

describe('mergeCredentialProducts', () => {
  it('attaches product summary or null', () => {
    const byId = new Map([['p1', { id: 'p1', name: 'Product One' }]]);
    expect(
      mergeCredentialProducts(
        [
          { id: 'c1', productId: 'p1' },
          { id: 'c2', productId: 'missing' },
          { id: 'c3', productId: null },
        ],
        byId,
      ),
    ).toEqual([
      { id: 'c1', productId: 'p1', product: { id: 'p1', name: 'Product One' } },
      { id: 'c2', productId: 'missing', product: null },
      { id: 'c3', productId: null, product: null },
    ]);
  });
});

describe('attachCredentialProducts', () => {
  it('batch-loads products in one query', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'p1', name: 'Alpha' },
      { id: 'p2', name: 'Beta' },
    ]);
    const prisma = { product: { findMany } };
    const items = [
      { id: 'c1', productId: 'p1' },
      { id: 'c2', productId: 'p2' },
      { id: 'c3', productId: null },
    ];

    const result = await attachCredentialProducts(prisma, items);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { id: { in: ['p1', 'p2'] } },
      select: { id: true, name: true },
    });
    expect(result[0]?.product).toEqual({ id: 'p1', name: 'Alpha' });
    expect(result[2]?.product).toBeNull();
  });

  it('skips query when no product ids', async () => {
    const findMany = vi.fn();
    const result = await attachCredentialProducts({ product: { findMany } }, [{ id: 'c1' }]);
    expect(findMany).not.toHaveBeenCalled();
    expect(result[0]?.product).toBeNull();
  });
});
