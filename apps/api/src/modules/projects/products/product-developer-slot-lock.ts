import { NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';
import type { ProductDeveloperSlotIds } from './product-developer-slots';

const PRODUCT_NOT_FOUND = 'Product not found';

/**
 * Serializes developer-slot writers: the next PUT sees committed ids
 * before it merges a partial patch.
 */
export async function lockProductDeveloperSlots(
  tx: TransactionClient,
  productId: string,
): Promise<ProductDeveloperSlotIds> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM products WHERE id = ${productId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException(PRODUCT_NOT_FOUND);
  }
  return tx.product.findUniqueOrThrow({
    where: { id: productId },
    select: { developerId: true, frontendDeveloperId: true },
  });
}
