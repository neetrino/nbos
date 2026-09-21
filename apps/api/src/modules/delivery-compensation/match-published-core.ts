import type { PrismaClient, ProductCategoryEnum, ProductTypeEnum } from '@nbos/database';

type ProfileDb = Pick<InstanceType<typeof PrismaClient>, 'deliveryBaseProfileVersion'>;

export type PublishedCoreLookup = {
  entityKind?: 'PRODUCT' | 'EXTENSION';
  productType: string | null;
  productCategory: string | null;
  implementationBase: string;
  designMode: string;
  aiDesignerReview: boolean;
};

/**
 * Same published-core match as configuration confirm: kind + confirmed parameters, with wildcard
 * type/category. Returns null instead of throwing so a deal quote can still be edited.
 */
export async function findPublishedCoreId(
  db: ProfileDb,
  input: PublishedCoreLookup,
): Promise<string | null> {
  const candidates = await db.deliveryBaseProfileVersion.findMany({
    where: {
      status: 'PUBLISHED',
      entityKind: input.entityKind ?? 'PRODUCT',
      implementationBase: input.implementationBase as never,
      designMode: input.designMode as never,
      aiDesignerReview: input.aiDesignerReview,
      OR: [{ productType: null }, { productType: input.productType as ProductTypeEnum }],
    },
    select: { id: true, productType: true, productCategory: true },
    orderBy: { version: 'desc' },
  });
  const matched = candidates.filter(
    (candidate) =>
      candidate.productCategory === null ||
      candidate.productCategory === (input.productCategory as ProductCategoryEnum | null),
  );
  return matched.find((candidate) => candidate.productType !== null)?.id ?? matched[0]?.id ?? null;
}
