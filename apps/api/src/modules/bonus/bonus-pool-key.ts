import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@nbos/database';

export type ParsedBonusPoolKey =
  | { kind: 'PRODUCT'; productId: string }
  | { kind: 'EXTENSION'; extensionId: string }
  | { kind: 'ORDER'; orderId: string };

/** Parses `product:{id}`, `extension:{id}`, or `order:{id}` pool keys from roll-up rows. */
export function parseBonusPoolKey(poolKey: string): ParsedBonusPoolKey {
  const trimmed = poolKey.trim();
  const colon = trimmed.indexOf(':');
  if (colon <= 0 || colon === trimmed.length - 1) {
    throw new BadRequestException(`Invalid poolKey: ${poolKey}`);
  }
  const prefix = trimmed.slice(0, colon);
  const id = trimmed.slice(colon + 1);
  if (prefix === 'product') {
    return { kind: 'PRODUCT', productId: id };
  }
  if (prefix === 'extension') {
    return { kind: 'EXTENSION', extensionId: id };
  }
  if (prefix === 'order') {
    return { kind: 'ORDER', orderId: id };
  }
  throw new BadRequestException(`Invalid poolKey prefix: ${prefix}`);
}

/** Prisma filter for all orders that belong to a product/extension/order pool. */
export function orderWhereForPoolKey(poolKey: string): Prisma.OrderWhereInput {
  const parsed = parseBonusPoolKey(poolKey);
  if (parsed.kind === 'PRODUCT') {
    return { productId: parsed.productId };
  }
  if (parsed.kind === 'EXTENSION') {
    return { extensionId: parsed.extensionId };
  }
  return { id: parsed.orderId };
}
