import type { PrismaClient, ProductCategoryEnum, ProductTypeEnum } from '@nbos/database';

type ProfileDb = Pick<InstanceType<typeof PrismaClient>, 'deliveryBaseProfileVersion'>;

export type PublishedCoreLookup = {
  entityKind?: 'PRODUCT' | 'EXTENSION';
  productType: string | null;
  productCategory: string | null;
};

export type PublishedCoreCandidate = {
  id: string;
  productType: string | null;
  productCategory: string | null;
};

/**
 * Same published-core match as configuration confirm: kind + product type, with wildcard
 * type/category. Implementation base, design mode and reviewer are not axes. Returns null
 * instead of throwing so a deal quote can still be edited.
 */
export async function findPublishedCoreId(
  db: ProfileDb,
  input: PublishedCoreLookup,
): Promise<string | null> {
  const candidates = await db.deliveryBaseProfileVersion.findMany({
    where: {
      status: 'PUBLISHED',
      entityKind: input.entityKind ?? 'PRODUCT',
      OR: [{ productType: null }, { productType: input.productType as ProductTypeEnum }],
    },
    select: { id: true, productType: true, productCategory: true },
    orderBy: { version: 'desc' },
  });
  const matched = candidates.filter((candidate) =>
    categoryMatches(candidate.productCategory, input.productCategory),
  );
  return pickPublishedCoreId(matched, input);
}

/** Newer rows first; exact type/category beats wildcards so a later generic profile cannot steal. */
export function pickPublishedCoreId(
  candidates: readonly PublishedCoreCandidate[],
  lookup: PublishedCoreLookup,
): string | null {
  let bestId: string | null = null;
  let bestRank = 0;
  for (const candidate of candidates) {
    const rank = rankPublishedCore(candidate, lookup);
    if (rank > bestRank) {
      bestId = candidate.id;
      bestRank = rank;
    }
  }
  return bestId;
}

function categoryMatches(profileCategory: string | null, requested: string | null): boolean {
  return profileCategory === null || profileCategory === (requested as ProductCategoryEnum | null);
}

function rankPublishedCore(candidate: PublishedCoreCandidate, lookup: PublishedCoreLookup): number {
  const exactType = candidate.productType !== null && candidate.productType === lookup.productType;
  const exactCategory = candidate.productCategory === lookup.productCategory;
  if (exactType && exactCategory) return 4;
  if (exactType && candidate.productCategory === null) return 3;
  if (candidate.productType === null && exactCategory) return 2;
  if (candidate.productType === null && candidate.productCategory === null) return 1;
  return 0;
}
