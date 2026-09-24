import type { ResolvedSalePriceTarget } from './build-sale-price-targets';

export type SalePriceSeedPlanEntry =
  | { action: 'CREATE'; item: ResolvedSalePriceTarget }
  | { action: 'UPDATE'; item: ResolvedSalePriceTarget }
  | { action: 'KEEP'; item: ResolvedSalePriceTarget };

export type SalePriceSeedPlan = {
  entries: SalePriceSeedPlanEntry[];
  createCount: number;
  updateCount: number;
  keepCount: number;
};

/**
 * One whole-card sale amount per target. A matching amount stays. A different amount is
 * replaced: the flat 10 000 / 20 000 seed is not an Owner edit.
 */
export function planDeliverySalePricesSeed(
  targets: readonly ResolvedSalePriceTarget[],
  existing: readonly { targetKey: string; amountPerUnit: string }[],
): SalePriceSeedPlan {
  const amountByKey = new Map(existing.map((row) => [row.targetKey, row.amountPerUnit]));
  const entries = targets.map<SalePriceSeedPlanEntry>((item) => {
    const current = amountByKey.get(item.targetKey);
    if (current === undefined) return { action: 'CREATE', item };
    if (sameAmount(current, item.amountPerUnit)) return { action: 'KEEP', item };
    return { action: 'UPDATE', item };
  });
  return {
    entries,
    createCount: countOf(entries, 'CREATE'),
    updateCount: countOf(entries, 'UPDATE'),
    keepCount: countOf(entries, 'KEEP'),
  };
}

export function formatSalePriceSeedPlan(plan: SalePriceSeedPlan, apply: boolean): string {
  const header = apply
    ? `Applying delivery sale prices: ${plan.createCount} to publish, ${plan.updateCount} to update, ${plan.keepCount} kept.`
    : `Dry run. ${plan.createCount} would be published, ${plan.updateCount} would change, ${plan.keepCount} already match.`;
  const lines = plan.entries.map((entry) => {
    const amount = entry.item.amountPerUnit;
    if (entry.action === 'KEEP') return `  KEEP   ${entry.item.code} ${amount}`;
    return `  ${entry.action.padEnd(6)} ${entry.item.code} ${amount} ${entry.item.targetKey}`;
  });
  return [header, ...lines].join('\n');
}

function sameAmount(current: string, desired: string): boolean {
  return Number(current) === Number(desired);
}

function countOf(
  entries: readonly SalePriceSeedPlanEntry[],
  action: SalePriceSeedPlanEntry['action'],
): number {
  return entries.filter((entry) => entry.action === action).length;
}
