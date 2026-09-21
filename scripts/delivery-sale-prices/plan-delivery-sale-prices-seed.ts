import { salePriceTargetKey } from '@nbos/shared';
import { saleAmountForCategory } from './sale-price-seed-amounts';

export type SalePriceSeedFunction = {
  id: string;
  code: string;
  category: string;
};

export type SalePriceSeedPlanEntry =
  | { action: 'CREATE'; item: SalePriceSeedFunction; amountPerUnit: string; targetKey: string }
  | { action: 'KEEP'; item: SalePriceSeedFunction; targetKey: string };

export type SalePriceSeedPlan = {
  entries: SalePriceSeedPlanEntry[];
  createCount: number;
  keepCount: number;
};

/**
 * One published sale rate per catalog function. A target that already has any version is left
 * alone: a re-run must not overwrite a number the Owner already wrote.
 */
export function planDeliverySalePricesSeed(
  functions: readonly SalePriceSeedFunction[],
  existingTargetKeys: readonly string[],
): SalePriceSeedPlan {
  const priced = new Set(existingTargetKeys);
  const entries = functions.map<SalePriceSeedPlanEntry>((item) => {
    const targetKey = salePriceTargetKey({ kind: 'FUNCTION', functionId: item.id });
    if (priced.has(targetKey)) {
      return { action: 'KEEP', item, targetKey };
    }
    return {
      action: 'CREATE',
      item,
      amountPerUnit: saleAmountForCategory(item.category),
      targetKey,
    };
  });
  return {
    entries,
    createCount: entries.filter((entry) => entry.action === 'CREATE').length,
    keepCount: entries.filter((entry) => entry.action === 'KEEP').length,
  };
}

export function formatSalePriceSeedPlan(plan: SalePriceSeedPlan, apply: boolean): string {
  const header = apply
    ? `Applying delivery sale prices: ${plan.createCount} to publish, ${plan.keepCount} kept.`
    : `Dry run. ${plan.createCount} would be published, ${plan.keepCount} already have a sale version.`;
  const lines = plan.entries.map((entry) =>
    entry.action === 'CREATE'
      ? `  CREATE ${entry.item.code} (${entry.item.category}) ${entry.amountPerUnit} ${entry.targetKey}`
      : `  KEEP   ${entry.item.code} -> ${entry.targetKey}`,
  );
  return [header, ...lines].join('\n');
}
