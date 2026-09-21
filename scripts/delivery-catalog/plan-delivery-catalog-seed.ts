import {
  DELIVERY_CATALOG_SEED_ITEMS,
  type DeliveryCatalogSeedItem,
} from './delivery-catalog-seed-data';

export type SeedPlanEntry =
  | { action: 'CREATE'; item: DeliveryCatalogSeedItem }
  | { action: 'UPDATE_COPY'; item: DeliveryCatalogSeedItem; existingId: string }
  | { action: 'KEEP'; item: DeliveryCatalogSeedItem; existingId: string };

export type SeedPlan = {
  entries: SeedPlanEntry[];
  createCount: number;
  updateCopyCount: number;
  keepCount: number;
};

export type SeedPlanOptions = {
  updateCopy?: boolean;
};

/**
 * Decides what the seed would write. Existing codes stay untouched unless copy-only updates are
 * explicitly requested. Copy updates never include operational or pricing fields.
 */
export function planDeliveryCatalogSeed(
  existing: ReadonlyArray<{ id: string; code: string }>,
  options: SeedPlanOptions = {},
  items: readonly DeliveryCatalogSeedItem[] = DELIVERY_CATALOG_SEED_ITEMS,
): SeedPlan {
  const byCode = new Map(existing.map((row) => [row.code, row.id]));
  const entries = items.map<SeedPlanEntry>((item) => {
    const existingId = byCode.get(item.code);
    if (!existingId) return { action: 'CREATE', item };
    return options.updateCopy
      ? { action: 'UPDATE_COPY', item, existingId }
      : { action: 'KEEP', item, existingId };
  });
  return {
    entries,
    createCount: entries.filter((entry) => entry.action === 'CREATE').length,
    updateCopyCount: entries.filter((entry) => entry.action === 'UPDATE_COPY').length,
    keepCount: entries.filter((entry) => entry.action === 'KEEP').length,
  };
}

export function formatSeedPlan(plan: SeedPlan, apply: boolean): string {
  const header = apply
    ? `Applying delivery catalog seed: ${plan.createCount} to create, ${plan.updateCopyCount} copy updates, ${plan.keepCount} kept.`
    : `Dry run. ${plan.createCount} would be created, ${plan.updateCopyCount} copy updates, ${plan.keepCount} already exist.`;
  const lines = plan.entries.map(formatSeedPlanEntry);
  return [header, ...lines].join('\n');
}

function formatSeedPlanEntry(entry: SeedPlanEntry): string {
  if (entry.action === 'CREATE') {
    return `  CREATE      ${entry.item.code} (${entry.item.category})`;
  }
  return `  ${entry.action.padEnd(11)} ${entry.item.code} -> ${entry.existingId}`;
}
