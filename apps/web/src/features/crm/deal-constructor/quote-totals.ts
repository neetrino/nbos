import { salePriceTargetKey, sumSalePrices } from '@nbos/shared';
import {
  groupSalePriceVersions,
  visibleSalePrice,
  type CatalogSalePriceRow,
} from '@/features/function-catalog/function-catalog-sale-price';

export type QuoteTotalItem = {
  functionId: string;
  tierId: string | null;
};

/**
 * Recommended sale total: published core + extras. Missing any published price returns null so the
 * UI does not invent a number. This never writes deal.amount.
 */
export function quoteSaleTotal(input: {
  coreVersionId: string | null;
  items: readonly QuoteTotalItem[];
  versions: readonly CatalogSalePriceRow[];
  canViewDraft: boolean;
}): string | null {
  const grouped = groupSalePriceVersions(input.versions);
  const amounts: Array<string | null> = [];
  if (input.coreVersionId) {
    amounts.push(
      amountForKey(
        salePriceTargetKey({ kind: 'CORE', baseProfileVersionId: input.coreVersionId }),
        grouped,
        input.canViewDraft,
      ),
    );
  }
  for (const item of input.items) {
    const key = item.tierId
      ? salePriceTargetKey({ kind: 'TIER', tierId: item.tierId })
      : salePriceTargetKey({ kind: 'FUNCTION', functionId: item.functionId });
    amounts.push(amountForKey(key, grouped, input.canViewDraft));
  }
  return amounts.length === 0 ? null : sumSalePrices(amounts);
}

export function quoteUnitsTotal(input: {
  coreUnits: number | undefined;
  extraUnits: ReadonlyArray<number | undefined>;
}): number | undefined {
  const parts = [input.coreUnits, ...input.extraUnits].filter(
    (value): value is number => value !== undefined,
  );
  if (parts.length === 0) return undefined;
  return parts.reduce((sum, value) => sum + value, 0);
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
