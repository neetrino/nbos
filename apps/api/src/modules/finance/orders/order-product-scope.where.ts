import type { Prisma } from '@nbos/database';

/** Product Finance: the product order plus extension orders owned by that product. */
export function buildOrderProductScopeWhere(productId: string): Prisma.OrderWhereInput {
  return {
    OR: [{ productId }, { extension: { productId } }],
  };
}
