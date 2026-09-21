import {
  DELIVERY_CATALOG_SEED_ITEMS,
  type DeliveryCatalogSeedItem,
} from './delivery-catalog-seed-data';

export type SeedPlanEntry =
  | { action: 'CREATE'; item: DeliveryCatalogSeedItem }
  | { action: 'KEEP'; item: DeliveryCatalogSeedItem; existingId: string };

export type SeedPlan = {
  entries: SeedPlanEntry[];
  createCount: number;
  keepCount: number;
};

/**
 * Decides what the seed would write. Existing codes are never touched: the Owner may have
 * edited content, units or status, and a re-run must not undo that.
 */
export function planDeliveryCatalogSeed(
  existing: ReadonlyArray<{ id: string; code: string }>,
  items: readonly DeliveryCatalogSeedItem[] = DELIVERY_CATALOG_SEED_ITEMS,
): SeedPlan {
  const byCode = new Map(existing.map((row) => [row.code, row.id]));
  const entries = items.map<SeedPlanEntry>((item) => {
    const existingId = byCode.get(item.code);
    return existingId ? { action: 'KEEP', item, existingId } : { action: 'CREATE', item };
  });
  return {
    entries,
    createCount: entries.filter((entry) => entry.action === 'CREATE').length,
    keepCount: entries.filter((entry) => entry.action === 'KEEP').length,
  };
}

export function formatSeedPlan(plan: SeedPlan, apply: boolean): string {
  const header = apply
    ? `Applying delivery catalog seed: ${plan.createCount} to create, ${plan.keepCount} kept.`
    : `Dry run. ${plan.createCount} would be created, ${plan.keepCount} already exist.`;
  const lines = plan.entries.map((entry) =>
    entry.action === 'CREATE'
      ? `  CREATE ${entry.item.code} (${entry.item.category})`
      : `  KEEP   ${entry.item.code} -> ${entry.existingId}`,
  );
  return [header, ...lines].join('\n');
}
