import { salePriceTargetKey, type SalePriceTarget } from '@nbos/shared';
import type {
  SalePriceDraftInput,
  SalePriceVersionDto,
} from '@/lib/api/delivery-catalog-structure';
import {
  SALE_PRICE_TARGET_KINDS,
  SALE_PRICE_ZERO,
  TARGET_KEY_SEPARATOR,
  type SalePriceTargetKind,
} from './delivery-norms.constants';
import { dateInputToIso, isValidDateInput } from './effective-from';

export type { SalePriceTargetKind };

export type SalePriceFormDraft = {
  amountPerUnit: string;
  effectiveFrom: string;
};

export type SalePriceFormResult =
  | { ok: false; error: 'effectiveFrom' | 'priceRequired' | 'notPositive' }
  | { ok: true; input: Pick<SalePriceDraftInput, 'amountPerUnit' | 'effectiveFrom'> };

export function parsePositiveDecimal(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= SALE_PRICE_ZERO) {
    return null;
  }
  return trimmed;
}

export function buildSalePriceFormInput(draft: SalePriceFormDraft): SalePriceFormResult {
  if (!isValidDateInput(draft.effectiveFrom)) {
    return { ok: false, error: 'effectiveFrom' };
  }
  if (draft.amountPerUnit.trim() === '') {
    return { ok: false, error: 'priceRequired' };
  }
  const amountPerUnit = parsePositiveDecimal(draft.amountPerUnit);
  if (amountPerUnit === null) {
    return { ok: false, error: 'notPositive' };
  }
  return {
    ok: true,
    input: { amountPerUnit, effectiveFrom: dateInputToIso(draft.effectiveFrom) },
  };
}

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

export function tierIdsFromSalePrices(rows: readonly SalePriceVersionDto[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    const parsed = parseSalePriceTargetKey(row.targetKey);
    if (parsed?.kind !== 'TIER' || ids.includes(parsed.id)) {
      continue;
    }
    ids.push(parsed.id);
  }
  return ids;
}

export function salePricesForTarget(
  rows: readonly SalePriceVersionDto[],
  targetKey: string | null,
): SalePriceVersionDto[] {
  if (targetKey === null) {
    return [];
  }
  return rows
    .filter((row) => row.targetKey === targetKey)
    .slice()
    .sort((left, right) => right.version - left.version);
}

export function groupSalePrices(
  rows: readonly SalePriceVersionDto[],
): Array<{ targetKey: string; rows: SalePriceVersionDto[] }> {
  const order: string[] = [];
  const grouped = new Map<string, SalePriceVersionDto[]>();
  for (const row of rows) {
    const list = grouped.get(row.targetKey);
    if (!list) {
      grouped.set(row.targetKey, [row]);
      order.push(row.targetKey);
      continue;
    }
    list.push(row);
  }
  return order.map((targetKey) => ({
    targetKey,
    rows: [...(grouped.get(targetKey) ?? [])].sort((left, right) => right.version - left.version),
  }));
}

export type SalePriceKindGroup = {
  kind: SalePriceTargetKind;
  groups: Array<{ targetKey: string; rows: SalePriceVersionDto[] }>;
};

export function groupSalePricesByKind(rows: readonly SalePriceVersionDto[]): SalePriceKindGroup[] {
  return SALE_PRICE_TARGET_KINDS.flatMap((kind) => {
    const groups = groupSalePrices(
      rows.filter((row) => parseSalePriceTargetKey(row.targetKey)?.kind === kind),
    );
    return groups.length === 0 ? [] : [{ kind, groups }];
  });
}

function isSalePriceTargetKind(value: string): value is SalePriceTargetKind {
  return (SALE_PRICE_TARGET_KINDS as readonly string[]).includes(value);
}
