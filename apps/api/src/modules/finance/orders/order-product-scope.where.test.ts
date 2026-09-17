import { describe, expect, it } from 'vitest';
import { buildOrderProductScopeWhere } from './order-product-scope.where';

describe('buildOrderProductScopeWhere', () => {
  it('includes the product order and extension orders of that product', () => {
    expect(buildOrderProductScopeWhere('prod-1')).toEqual({
      OR: [{ productId: 'prod-1' }, { extension: { productId: 'prod-1' } }],
    });
  });
});
