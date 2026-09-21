import type { PrismaClient } from '@nbos/database';
import type { DeliveryCatalogSeedItem } from './delivery-catalog-seed-data';

/**
 * Adds missing product-type mappings on existing gradations. Never removes mappings and
 * never touches units.
 */
export async function syncCatalogTierProductTypes(
  prisma: PrismaClient,
  item: DeliveryCatalogSeedItem,
): Promise<number> {
  if (!item.tiers?.length) return 0;
  const current = await prisma.deliveryFunction.findUnique({
    where: { code: item.code },
    select: {
      id: true,
      tiers: { select: { id: true, code: true, productTypes: { select: { productType: true } } } },
    },
  });
  if (!current) return 0;
  let added = 0;
  for (const seedTier of item.tiers) {
    const row = current.tiers.find((tier) => tier.code === seedTier.code);
    if (!row) continue;
    const existing = new Set(row.productTypes.map((entry) => entry.productType));
    for (const productType of seedTier.productTypes) {
      if (existing.has(productType)) continue;
      await prisma.deliveryFunctionTierProductType.create({
        data: { tierId: row.id, productType },
      });
      added += 1;
    }
  }
  return added;
}
