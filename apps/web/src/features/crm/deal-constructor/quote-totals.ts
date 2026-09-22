import {
  salePriceTargetKey,
  scaleMoney,
  sumSalePrices,
  VOLUME_FACTOR_STANDARD,
} from '@nbos/shared';
import {
  groupSalePriceVersions,
  visibleSalePrice,
  type CatalogSalePriceRow,
  type VisibleSalePrice,
} from '@/features/function-catalog/function-catalog-sale-price';

export type QuoteTotalItem = {
  functionId: string;
  tierId: string | null;
  volumeFactor?: string;
};

/**
 * Recommended sale total: published core + extras. Missing any published price returns null so the
 * UI does not invent a number. This never writes deal.amount.
 */
export function quoteSaleTotal(input: {
  coreVersionId: string | null;
  coreVolumeFactor?: string;
  items: readonly QuoteTotalItem[];
  versions: readonly CatalogSalePriceRow[];
  canViewDraft: boolean;
}): string | null {
  const grouped = groupSalePriceVersions(input.versions);
  const amounts: Array<string | null> = [];
  if (input.coreVersionId) {
    amounts.push(
      scaleAmount(
        amountForKey(
          salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: input.coreVersionId }),
          grouped,
          input.canViewDraft,
        ),
        input.coreVolumeFactor,
      ),
    );
  }
  for (const item of input.items) {
    const key = item.tierId
      ? salePriceTargetKey({ kind: 'TIER', tierId: item.tierId })
      : salePriceTargetKey({ kind: 'FUNCTION', functionId: item.functionId });
    amounts.push(scaleAmount(amountForKey(key, grouped, input.canViewDraft), item.volumeFactor));
  }
  return amounts.length === 0 ? null : sumSalePrices(amounts);
}

export function quoteSaleMissing(input: {
  coreVersionId: string | null;
  items: readonly QuoteTotalItem[];
  versions: readonly CatalogSalePriceRow[];
  canViewDraft: boolean;
}): 'core' | 'extra' | null {
  if (quoteSaleTotal(input) !== null) return null;
  const grouped = groupSalePriceVersions(input.versions);
  if (input.coreVersionId) {
    const coreAmount = amountForKey(
      salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: input.coreVersionId }),
      grouped,
      input.canViewDraft,
    );
    if (coreAmount === null) return 'core';
  }
  return input.items.length > 0 ? 'extra' : null;
}

export function visibleCoreSalePrice(input: {
  coreVersionId: string | null;
  coreVolumeFactor?: string;
  versions: readonly CatalogSalePriceRow[];
  canViewDraft: boolean;
}): VisibleSalePrice | undefined {
  if (!input.coreVersionId) return undefined;
  const grouped = groupSalePriceVersions(input.versions);
  return scaleVisiblePrice(
    visibleSalePrice({
      canViewRules: input.canViewDraft,
      versions:
        grouped.get(
          salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: input.coreVersionId }),
        ) ?? [],
    }),
    input.coreVolumeFactor,
  );
}

export function visibleQuoteItemPrices(input: {
  items: readonly QuoteTotalItem[];
  versions: readonly CatalogSalePriceRow[];
  canViewDraft: boolean;
}): Map<string, VisibleSalePrice> {
  const grouped = groupSalePriceVersions(input.versions);
  const result = new Map<string, VisibleSalePrice>();
  for (const item of input.items) {
    const key = item.tierId
      ? salePriceTargetKey({ kind: 'TIER', tierId: item.tierId })
      : salePriceTargetKey({ kind: 'FUNCTION', functionId: item.functionId });
    const price = visibleSalePrice({
      canViewRules: input.canViewDraft,
      versions: grouped.get(key) ?? [],
    });
    const scaled = scaleVisiblePrice(price, item.volumeFactor);
    if (scaled) result.set(item.functionId, scaled);
  }
  return result;
}

export function quoteUnitsTotal(input: {
  coreUnits: number | undefined;
  coreVolumeFactor?: string;
  extraUnits: ReadonlyArray<number | undefined>;
  extraVolumeFactors?: ReadonlyArray<string | undefined>;
}): number | undefined {
  const parts = [
    scaleCount(input.coreUnits, input.coreVolumeFactor),
    ...input.extraUnits.map((units, index) => scaleCount(units, input.extraVolumeFactors?.[index])),
  ].filter((value): value is number => value !== undefined);
  if (parts.length === 0) return undefined;
  return parts.reduce((sum, value) => sum + value, 0);
}

function scaleAmount(amount: string | null, factor: string | undefined): string | null {
  if (amount === null) return null;
  const applied = factor ?? VOLUME_FACTOR_STANDARD;
  if (applied === VOLUME_FACTOR_STANDARD) return amount;
  return scaleMoney(amount, applied);
}

function scaleVisiblePrice(
  price: VisibleSalePrice | undefined,
  factor: string | undefined,
): VisibleSalePrice | undefined {
  if (!price) return undefined;
  const amount = scaleAmount(price.amount, factor);
  if (amount === null || amount === price.amount) return price;
  return { ...price, amount };
}

function scaleCount(units: number | undefined, factor: string | undefined): number | undefined {
  if (units === undefined) return undefined;
  const applied = factor ?? VOLUME_FACTOR_STANDARD;
  if (applied === VOLUME_FACTOR_STANDARD) return units;
  return Number(scaleMoney(units.toFixed(2), applied));
}

function amountForKey(
  key: string,
  grouped: Map<string, CatalogSalePriceRow[]>,
  canViewDraft: boolean,
): string | null {
  return (
    visibleSalePrice({
      canViewRules: canViewDraft,
      versions: grouped.get(key) ?? [],
    })?.amount ?? null
  );
}
