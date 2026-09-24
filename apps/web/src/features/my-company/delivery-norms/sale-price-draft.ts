import { salePriceTargetKey, type SalePriceTarget } from '@nbos/shared';
import type { SalePriceDraftInput } from '@/lib/api/delivery-catalog-structure';
import {
  SALE_PRICE_TARGET_KINDS,
  TARGET_KEY_SEPARATOR,
  type SalePriceTargetKind,
} from './delivery-norms.constants';

export type { SalePriceTargetKind };

export function salePriceTargetFromKind(kind: SalePriceTargetKind, id: string): SalePriceTarget {
  if (kind === 'FUNCTION') {
    return { kind: 'FUNCTION', functionId: id };
  }
  if (kind === 'TIER') {
    return { kind: 'TIER', tierId: id };
  }
  return { kind: 'CORE', baseProfileVersionId: id };
}

export function targetKeyForKind(kind: SalePriceTargetKind, id: string): string {
  return salePriceTargetKey(salePriceTargetFromKind(kind, id));
}

export function salePriceDraftBody(
  kind: SalePriceTargetKind,
  targetId: string,
  input: { amountPerUnit: string; effectiveFrom: string },
): SalePriceDraftInput {
  return {
    ...(kind === 'FUNCTION' ? { functionId: targetId } : {}),
    ...(kind === 'TIER' ? { tierId: targetId } : {}),
    ...(kind === 'CORE' ? { baseProfileVersionId: targetId } : {}),
    ...input,
  };
}

export function parseSalePriceTargetKey(
  targetKey: string,
): { kind: SalePriceTargetKind; id: string } | null {
  const separatorIndex = targetKey.indexOf(TARGET_KEY_SEPARATOR);
  if (separatorIndex <= 0) {
    return null;
  }
  const kind = targetKey.slice(0, separatorIndex);
  const id = targetKey.slice(separatorIndex + TARGET_KEY_SEPARATOR.length);
  if (id === '' || !isSalePriceTargetKind(kind)) {
    return null;
  }
  return { kind, id };
}

export type CatalogGradation = { id: string; label: string };

/**
 * Every gradation in the catalog, so a volume can be priced before it has any price at all. Prices
 * alone would only ever show volumes that were already priced once.
 */
export function gradationsFromCatalog(
  catalog: ReadonlyArray<{ title: string; tiers?: ReadonlyArray<{ id: string; label: string }> }>,
): CatalogGradation[] {
  return catalog.flatMap((item) =>
    (item.tiers ?? []).map((tier) => ({ id: tier.id, label: `${item.title} · ${tier.label}` })),
  );
}

function isSalePriceTargetKind(value: string): value is SalePriceTargetKind {
  return (SALE_PRICE_TARGET_KINDS as readonly string[]).includes(value);
}
