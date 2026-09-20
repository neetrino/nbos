import { PrismaClient } from '@nbos/database';

const MISSING_BASE_PROFILE_LABEL = 'product base profile';

/**
 * Labels of V2 items on this product that still have no published units.
 * Legacy cards and cards without a V2 configuration return an empty list.
 *
 * A materialized plan is already frozen: its components carry their own units and rate
 * snapshots, so publishing a newer norm version later must not block closing the card.
 * Only a card whose plan does not exist yet is checked against currently published norms,
 * and only for functions that are paid extras — an included-in-base function has no own units.
 */
export async function loadUnpricedDeliveryNormativeLabels(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
): Promise<string[]> {
  const configuration = await prisma.deliveryConfiguration.findUnique({
    where: { productId },
    select: {
      mode: true,
      initialRevisionId: true,
      baseProfileVersion: { select: { status: true } },
      features: {
        where: { archivedAt: null, origin: 'EXTRA' },
        select: { function: { select: { code: true } } },
      },
    },
  });
  if (!configuration || configuration.mode !== 'V2') {
    return [];
  }
  if (configuration.initialRevisionId) {
    return [];
  }

  const labels: string[] = [];
  if (configuration.baseProfileVersion?.status !== 'PUBLISHED') {
    labels.push(MISSING_BASE_PROFILE_LABEL);
  }
  const featureCodes = configuration.features.map((feature) => feature.function.code);
  labels.push(...(await findFunctionsWithoutPublishedUnits(prisma, featureCodes)));
  return labels;
}

async function findFunctionsWithoutPublishedUnits(
  prisma: InstanceType<typeof PrismaClient>,
  functionCodes: readonly string[],
): Promise<string[]> {
  if (functionCodes.length === 0) {
    return [];
  }
  const priced = await prisma.deliveryFunction.findMany({
    where: {
      code: { in: [...functionCodes] },
      priceVersions: { some: { status: 'PUBLISHED' } },
    },
    select: { code: true },
  });
  const pricedCodes = new Set(priced.map((row) => row.code));
  return functionCodes.filter((code) => !pricedCodes.has(code));
}
