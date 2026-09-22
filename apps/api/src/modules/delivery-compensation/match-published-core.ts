import type { PrismaClient, ProductTypeEnum } from '@nbos/database';

type ProfileDb = Pick<InstanceType<typeof PrismaClient>, 'deliveryBaseProfileVersion'>;

/**
 * Newest published core for one product kind. An extension has no core, and category,
 * implementation base, design mode and size are not axes.
 */
export async function findPublishedCoreId(
  db: ProfileDb,
  input: { productType: string | null },
): Promise<string | null> {
  if (!input.productType) return null;
  const row = await db.deliveryBaseProfileVersion.findFirst({
    where: {
      status: 'PUBLISHED',
      productType: input.productType as ProductTypeEnum,
    },
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
    select: { id: true },
  });
  return row?.id ?? null;
}
