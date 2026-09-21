import {
  DEFAULT_SALE_MULTIPLIER,
  resolveSalePrice,
  salePriceTargetKey,
  sumSalePrices,
} from '@nbos/shared';
import {
  DEVELOPER_RATE_ROLE_KEY,
  DRAFT_PRICE_STATUS,
  PUBLISHED_PRICE_STATUS,
} from './function-catalog.constants';

export type CatalogSalePriceRow = {
  targetKey: string;
  version: number;
  status: string;
  multiplier: string | null;
  fixedAmount: string | null;
};

export type CatalogRateRow = {
  roleKey: string;
  version: number;
  status: string;
  rate: string;
};

export type VisibleSalePrice = {
  amount: string;
  unpublished: boolean;
};

export type VisibleSalePriceInput = {
  canViewRules: boolean;
  versions: readonly CatalogSalePriceRow[];
  units: string | null | undefined;
  developerRate: string | null | undefined;
  defaultMultiplier: string;
};

/**
 * Units and the developer rate are confidential. Callers without
 * DELIVERY_COMPENSATION_RULES VIEW must not fetch them or pass them here.
 */
export function visibleSalePrice(input: VisibleSalePriceInput): VisibleSalePrice | undefined {
  const version = pickSalePriceVersion(input.versions, input.canViewRules);
  if (!version) return undefined;
  const resolved = resolveSalePrice({
    units: confidentialOrNull(input.canViewRules, input.units),
    developerRate: confidentialOrNull(input.canViewRules, input.developerRate),
    multiplier: version.multiplier,
    fixedAmount: version.fixedAmount,
    defaultMultiplier: input.defaultMultiplier || DEFAULT_SALE_MULTIPLIER,
  });
  if (resolved.amount === null) return undefined;
  if (!input.canViewRules && resolved.source !== 'FIXED') return undefined;
  return {
    amount: resolved.amount,
    unpublished: version.status === DRAFT_PRICE_STATUS,
  };
}

export function salePriceCardLabels(
  price: VisibleSalePrice | undefined,
  formatSalePrice: (amount: string) => string,
  unpublishedLabel: string,
): { salePriceLabel?: string; unpublishedLabel?: string } {
  if (!price) return {};
  return {
    salePriceLabel: formatSalePrice(price.amount),
    unpublishedLabel: price.unpublished ? unpublishedLabel : undefined,
  };
}

export function pickSalePriceVersion(
  rows: readonly CatalogSalePriceRow[],
  canViewDraft: boolean,
): CatalogSalePriceRow | undefined {
  const published = newest(rows.filter((row) => row.status === PUBLISHED_PRICE_STATUS));
  if (published) return published;
  if (!canViewDraft) return undefined;
  return newest(rows.filter((row) => row.status === DRAFT_PRICE_STATUS));
}

export function visibleSalePriceByFunctionId(
  functionIds: readonly string[],
  versions: readonly CatalogSalePriceRow[],
  input: Omit<VisibleSalePriceInput, 'versions' | 'units'> & {
    unitsByFunctionId: Map<string, number> | undefined;
  },
): Map<string, VisibleSalePrice> {
  const grouped = groupSalePriceVersions(versions);
  const result = new Map<string, VisibleSalePrice>();
  for (const functionId of functionIds) {
    const price = visibleSalePrice({
      canViewRules: input.canViewRules,
      versions: grouped.get(functionTargetKey(functionId)) ?? [],
      units: unitsFor(input.canViewRules, input.unitsByFunctionId, functionId),
      developerRate: input.developerRate,
      defaultMultiplier: input.defaultMultiplier,
    });
    if (price) result.set(functionId, price);
  }
  return result;
}

export function sumSelectionSalePrices(
  prices: ReadonlyArray<VisibleSalePrice | undefined>,
): string | null {
  return sumSalePrices(prices.map((price) => price?.amount ?? null));
}

export function groupSalePriceVersions(
  rows: readonly CatalogSalePriceRow[],
): Map<string, CatalogSalePriceRow[]> {
  const grouped = new Map<string, CatalogSalePriceRow[]>();
  for (const row of rows) {
    const existing = grouped.get(row.targetKey);
    if (existing) existing.push(row);
    else grouped.set(row.targetKey, [row]);
  }
  return grouped;
}

export function functionTargetKey(functionId: string): string {
  return salePriceTargetKey({ kind: 'FUNCTION', functionId });
}

export async function loadDeveloperRateIfPermitted(
  canViewRules: boolean,
  loadRates: () => Promise<readonly CatalogRateRow[]>,
): Promise<string | undefined> {
  if (!canViewRules) return undefined;
  return pickDeveloperRate(await loadRates());
}

export function pickDeveloperRate(rows: readonly CatalogRateRow[]): string | undefined {
  const backend = rows.filter((row) => row.roleKey === DEVELOPER_RATE_ROLE_KEY);
  return (
    newest(backend.filter((row) => row.status === PUBLISHED_PRICE_STATUS)) ??
    newest(backend.filter((row) => row.status === DRAFT_PRICE_STATUS))
  )?.rate;
}

function confidentialOrNull(
  canViewRules: boolean,
  value: string | null | undefined,
): string | null {
  if (!canViewRules) return null;
  return value ?? null;
}

function unitsFor(
  canViewRules: boolean,
  unitsByFunctionId: Map<string, number> | undefined,
  functionId: string,
): string | null {
  if (!canViewRules || !unitsByFunctionId) return null;
  const total = unitsByFunctionId.get(functionId);
  return total === undefined ? null : String(total);
}

function newest<T extends { version: number }>(rows: readonly T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((left, right) => right.version - left.version)[0];
}
