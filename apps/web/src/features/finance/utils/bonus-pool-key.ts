import { DELIVERY_BOARD_OPEN_ITEM_QUERY } from '@/features/projects/constants/delivery-board-open-query';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

export type ParsedBonusPoolKey =
  | { kind: 'PRODUCT'; productId: string }
  | { kind: 'EXTENSION'; extensionId: string }
  | { kind: 'ORDER'; orderId: string };

/** Parses `product:{id}`, `extension:{id}`, or `order:{id}` from pool roll-up keys. */
export function parseBonusPoolKey(poolKey: string): ParsedBonusPoolKey | null {
  const trimmed = poolKey.trim();
  const colon = trimmed.indexOf(':');
  if (colon <= 0 || colon === trimmed.length - 1) return null;
  const prefix = trimmed.slice(0, colon);
  const id = trimmed.slice(colon + 1);
  if (prefix === 'product') return { kind: 'PRODUCT', productId: id };
  if (prefix === 'extension') return { kind: 'EXTENSION', extensionId: id };
  if (prefix === 'order') return { kind: 'ORDER', orderId: id };
  return null;
}

/** In-app href for the pool scope entity (product page, delivery board, or orders list). */
export function bonusPoolScopeEntityHref(
  pool: BonusProductPoolRow,
  parsed: ParsedBonusPoolKey,
): string {
  if (parsed.kind === 'PRODUCT') {
    return `/projects/${pool.projectId}/products/${parsed.productId}`;
  }
  if (parsed.kind === 'EXTENSION') {
    const q = new URLSearchParams({
      [DELIVERY_BOARD_OPEN_ITEM_QUERY]: `extension-${parsed.extensionId}`,
    });
    return `/delivery-board?${q.toString()}`;
  }
  return '/finance/orders';
}
