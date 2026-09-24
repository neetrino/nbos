import type { PrismaClient } from '@nbos/database';

type Db = Pick<
  InstanceType<typeof PrismaClient>,
  'order' | 'deliveryDealQuote' | 'deliveryConfiguration' | 'deliveryConfigurationFeature'
>;

/**
 * Copies extra functions from the deal quote onto a freshly enrolled configuration.
 * Included-in-base still comes from the profile, never from the collection.
 */
export async function copyDealQuoteExtras(
  db: Db,
  productId: string,
  configurationId: string,
  orderId?: string,
): Promise<void> {
  const order = await db.order.findFirst({
    where: orderId
      ? { id: orderId, productId, dealId: { not: null } }
      : { productId, dealId: { not: null } },
    select: { dealId: true },
  });
  if (!order?.dealId) return;
  const quote = await db.deliveryDealQuote.findUnique({
    where: { dealId: order.dealId },
    include: { items: { orderBy: { position: 'asc' } } },
  });
  if (!quote) return;
  await db.deliveryConfiguration.update({
    where: { id: configurationId },
    data: {
      coreVolumeFactor: quote.coreVolumeFactor,
      coreVolumeReason: quote.coreVolumeReason,
    },
  });
  if (quote.items.length === 0) return;
  const existing = await db.deliveryConfigurationFeature.findMany({
    where: { configurationId, archivedAt: null },
    select: { functionId: true },
  });
  const known = new Set(existing.map((row) => row.functionId));
  const missing = quote.items.filter((item) => !known.has(item.functionId));
  if (missing.length === 0) return;
  await db.deliveryConfigurationFeature.createMany({
    data: missing.map((item) => ({
      configurationId,
      functionId: item.functionId,
      tierId: item.tierId,
      volumeFactor: item.volumeFactor,
      volumeReason: item.volumeReason,
      origin: 'EXTRA' as const,
    })),
  });
}
