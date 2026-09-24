import { salePriceTargetKey } from '@nbos/shared';
import { totalSeedUnits } from '../delivery-catalog/data/catalog-seed-types';
import {
  DELIVERY_CATALOG_SEED_ITEMS,
  type DeliveryCatalogSeedItem,
} from '../delivery-catalog/delivery-catalog-seed-data';
import { saleAmountForUnits } from './sale-price-seed-amounts';

export type SalePriceTargetDraft = {
  code: string;
  amountPerUnit: string;
  functionCode: string;
  tierCode: string | null;
};

export type ResolvedSalePriceTarget = SalePriceTargetDraft & {
  targetKey: string;
  functionId: string;
  tierId: string | null;
};

/**
 * One whole-card price per function, and one per gradation when the card has volumes.
 * A tiered card also keeps a function price equal to its smallest volume so the catalog
 * grid is not left on the old flat amount.
 */
export function buildSalePriceTargetDrafts(
  items: readonly DeliveryCatalogSeedItem[] = DELIVERY_CATALOG_SEED_ITEMS,
): SalePriceTargetDraft[] {
  return items.flatMap((item) => draftsForItem(item));
}

export function resolveSalePriceTargets(
  drafts: readonly SalePriceTargetDraft[],
  functions: readonly { id: string; code: string }[],
  tiers: readonly { id: string; code: string; functionCode: string }[],
): { targets: ResolvedSalePriceTarget[]; missing: string[] } {
  const functionByCode = new Map(functions.map((row) => [row.code, row.id]));
  const tierByKey = new Map(tiers.map((row) => [`${row.functionCode}/${row.code}`, row]));
  const missing: string[] = [];
  const targets: ResolvedSalePriceTarget[] = [];
  for (const draft of drafts) {
    const resolved = resolveOne(draft, functionByCode, tierByKey);
    if (!resolved) {
      missing.push(draft.code);
      continue;
    }
    targets.push(resolved);
  }
  return { targets, missing };
}

function draftsForItem(item: DeliveryCatalogSeedItem): SalePriceTargetDraft[] {
  if (item.tiers?.length) {
    const tierDrafts = item.tiers.map((tier) => ({
      code: `${item.code}/${tier.code}`,
      amountPerUnit: saleAmountForUnits(totalSeedUnits(tier.units)),
      functionCode: item.code,
      tierCode: tier.code,
    }));
    const smallest = [...tierDrafts].sort(
      (left, right) => Number(left.amountPerUnit) - Number(right.amountPerUnit),
    )[0];
    if (!smallest) return tierDrafts;
    return [
      {
        code: item.code,
        amountPerUnit: smallest.amountPerUnit,
        functionCode: item.code,
        tierCode: null,
      },
      ...tierDrafts,
    ];
  }
  if (!item.units) return [];
  return [
    {
      code: item.code,
      amountPerUnit: saleAmountForUnits(totalSeedUnits(item.units)),
      functionCode: item.code,
      tierCode: null,
    },
  ];
}

function resolveOne(
  draft: SalePriceTargetDraft,
  functionByCode: ReadonlyMap<string, string>,
  tierByKey: ReadonlyMap<string, { id: string }>,
): ResolvedSalePriceTarget | null {
  const functionId = functionByCode.get(draft.functionCode);
  if (!functionId) return null;
  if (!draft.tierCode) {
    return {
      ...draft,
      functionId,
      tierId: null,
      targetKey: salePriceTargetKey({ kind: 'FUNCTION', functionId }),
    };
  }
  const tier = tierByKey.get(`${draft.functionCode}/${draft.tierCode}`);
  if (!tier) return null;
  return {
    ...draft,
    functionId,
    tierId: tier.id,
    targetKey: salePriceTargetKey({ kind: 'TIER', tierId: tier.id }),
  };
}
