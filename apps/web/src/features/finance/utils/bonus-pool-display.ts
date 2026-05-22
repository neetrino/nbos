import type { BonusProductPoolKind, BonusProductPoolRow } from '@/lib/api/bonus';

/** NBOS pool scope: bonuses roll up per Product / Extension (order fallback only). */
export const BONUS_POOL_SCOPE_COLUMN_LABEL = 'Product / Extension';

const BONUS_POOL_KIND_LABEL: Record<BonusProductPoolKind, string> = {
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
  ORDER: 'Order (pool)',
};

export function bonusPoolKindLabel(kind: BonusProductPoolKind): string {
  return BONUS_POOL_KIND_LABEL[kind];
}

/** Primary scope title — product or extension name, or order label when no product/extension. */
export function bonusPoolScopeTitle(row: BonusProductPoolRow): string {
  return row.poolName;
}
