import { salePriceTargetKey, sumSalePrices } from '@nbos/shared';
import { DRAFT_PRICE_STATUS, PUBLISHED_PRICE_STATUS } from './function-catalog.constants';

export type CatalogSalePriceRow = {
  targetKey: string;
  version: number;
  status: string;
  resolvedAmount: string | null;
};

export type VisibleSalePrice = {
  amount: string;
  unpublished: boolean;
};

/**
 * Client AMD already resolved on the server. Units stay off this path so a catalog viewer
 * never sees cost.
 */
export function visibleSalePrice(input: {
  canViewRules: boolean;
  versions: readonly CatalogSalePriceRow[];
}): VisibleSalePrice | undefined {
  const version = pickSalePriceVersion(input.versions, input.canViewRules);
  if (!version || version.resolvedAmount === null) return undefined;
  return {
    amount: version.resolvedAmount,
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
  canViewRules: boolean,
): Map<string, VisibleSalePrice> {
  const grouped = groupSalePriceVersions(versions);
  const result = new Map<string, VisibleSalePrice>();
  for (const functionId of functionIds) {
    const price = visibleSalePrice({
      canViewRules,
      versions: grouped.get(functionTargetKey(functionId)) ?? [],
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

function newest<T extends { version: number }>(rows: readonly T[]): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((left, right) => right.version - left.version)[0];
}
