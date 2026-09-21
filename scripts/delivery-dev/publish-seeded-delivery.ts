import { createPrismaClient, type PrismaClient } from '@nbos/database';
import { frozenDeliveryAxes, isPublishedRoleVectorComplete, PRODUCT_TYPES } from '@nbos/shared';
import { loadDevDeliveryEnv } from './load-dev-delivery-env';
import { pickNewestDraftsByTier } from './pick-newest-draft-prices';
import { resolveSeedAuthorId } from './resolve-seed-author';
import { DELIVERY_CATALOG_SEED_ITEMS } from '../delivery-catalog/delivery-catalog-seed-data';
import { buildSeededProfileKeys } from '../delivery-profiles/delivery-profiles-seed-data';

loadDevDeliveryEnv();

const APPLY_FLAG = '--apply';
const AUTHOR_FLAG = '--author=';

/**
 * Activates seeded catalog cards and publishes their draft units and cores on the
 * development database so the Owner can test. Dry run by default.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const authorId = await resolveSeedAuthorId(prisma, readAuthorId());
    const functionCodes = DELIVERY_CATALOG_SEED_ITEMS.map((item) => item.code);
    const coreKeys = buildSeededProfileKeys();
    const functions = await prisma.deliveryFunction.findMany({
      where: { code: { in: functionCodes } },
      select: {
        id: true,
        code: true,
        status: true,
        contentVersions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { id: true, publishedAt: true },
        },
        priceVersions: {
          where: { status: 'DRAFT' },
          select: { id: true, version: true, tierId: true, roleUnits: true },
        },
      },
    });
    const cores = await prisma.deliveryBaseProfileVersion.findMany({
      where: { profileKey: { in: coreKeys }, status: 'DRAFT' },
      select: { id: true, profileKey: true, roleUnits: true },
    });
    process.stdout.write(
      `${apply ? 'Publishing' : 'Dry run'} ${functions.length} functions and ${cores.length} draft cores.\n`,
    );
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to publish.\n`);
      return;
    }
    let activated = 0;
    let prices = 0;
    for (const row of functions) {
      activated += await activateFunction(prisma, row);
      prices += await publishDraftPrices(prisma, row, authorId);
    }
    let publishedCores = 0;
    for (const core of cores) {
      publishedCores += await publishCore(prisma, core, authorId);
    }
    const listCount = await upsertProductTypeList(prisma);
    process.stdout.write(
      `Activated ${activated}, published ${prices} price versions and ${publishedCores} cores, upserted ${listCount} PRODUCT_TYPE list options.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

function readAuthorId(): string | null {
  const arg = process.argv.find((value) => value.startsWith(AUTHOR_FLAG));
  return arg ? arg.slice(AUTHOR_FLAG.length).trim() || null : null;
}

async function activateFunction(
  prisma: PrismaClient,
  row: {
    id: string;
    status: string;
    contentVersions: Array<{ id: string; publishedAt: Date | null }>;
  },
): Promise<number> {
  const latest = row.contentVersions[0];
  if (row.status === 'ACTIVE' && latest?.publishedAt) return 0;
  if (!latest) throw new Error('Catalog function has no content version.');
  await prisma.deliveryFunction.update({
    where: { id: row.id },
    data: {
      status: 'ACTIVE',
      contentVersions: latest.publishedAt
        ? undefined
        : { update: { where: { id: latest.id }, data: { publishedAt: new Date() } } },
    },
  });
  return 1;
}

async function publishDraftPrices(
  prisma: PrismaClient,
  row: {
    id: string;
    priceVersions: Array<{
      id: string;
      version: number;
      tierId: string | null;
      roleUnits: Array<{
        roleKey: string;
        unitKind: string;
        units: { toString(): string } | null;
      }>;
    }>;
  },
  authorId: string,
): Promise<number> {
  let published = 0;
  for (const draft of pickNewestDraftsByTier(row.priceVersions)) {
    const roleUnits = draft.roleUnits.map((unit) => ({
      roleKey: unit.roleKey,
      unitKind: unit.unitKind,
      units: unit.units ? unit.units.toString() : null,
    })) as Parameters<typeof isPublishedRoleVectorComplete>[0];
    if (!isPublishedRoleVectorComplete(roleUnits)) {
      process.stderr.write(`Skipping incomplete draft price ${draft.id}.\n`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await tx.deliveryFunctionPriceVersion.updateMany({
        where: {
          functionId: row.id,
          tierId: draft.tierId,
          status: 'PUBLISHED',
        },
        data: { status: 'ARCHIVED' },
      });
      await tx.deliveryFunctionPriceVersion.update({
        where: { id: draft.id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: authorId },
      });
    });
    published += 1;
  }
  return published;
}

async function publishCore(
  prisma: PrismaClient,
  core: {
    id: string;
    profileKey: string;
    roleUnits: Array<{ roleKey: string; unitKind: string; units: { toString(): string } | null }>;
  },
  authorId: string,
): Promise<number> {
  const roleUnits = core.roleUnits.map((unit) => ({
    roleKey: unit.roleKey,
    unitKind: unit.unitKind,
    units: unit.units ? unit.units.toString() : null,
  })) as Parameters<typeof isPublishedRoleVectorComplete>[0];
  if (!isPublishedRoleVectorComplete(roleUnits)) {
    process.stderr.write(`Skipping incomplete draft core ${core.profileKey}.\n`);
    return 0;
  }
  const current = await prisma.deliveryBaseProfileVersion.findUnique({
    where: { id: core.id },
    select: { profileKey: true, entityKind: true, productType: true, productCategory: true },
  });
  if (!current) return 0;
  await prisma.$transaction(async (tx) => {
    await tx.deliveryBaseProfileVersion.updateMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { profileKey: current.profileKey },
          {
            entityKind: current.entityKind,
            productType: current.productType,
            productCategory: current.productCategory,
          },
        ],
      },
      data: { status: 'ARCHIVED' },
    });
    await tx.deliveryBaseProfileVersion.update({
      where: { id: core.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: authorId,
        ...frozenDeliveryAxes(),
      },
    });
  });
  return 1;
}

async function upsertProductTypeList(prisma: PrismaClient): Promise<number> {
  let count = 0;
  for (const [index, code] of PRODUCT_TYPES.entries()) {
    await prisma.systemListOption.upsert({
      where: { listKey_code: { listKey: 'PRODUCT_TYPE', code } },
      create: { listKey: 'PRODUCT_TYPE', code, label: code, sortOrder: index },
      update: { label: code, sortOrder: index, isActive: true },
    });
    count += 1;
  }
  return count;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
