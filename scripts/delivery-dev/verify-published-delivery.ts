import { createPrismaClient } from '@nbos/database';
import { DELIVERY_CATALOG_SEED_ITEMS } from '../delivery-catalog/delivery-catalog-seed-data';
import { buildSeededProfileKeys } from '../delivery-profiles/delivery-profiles-seed-data';
import { loadDevDeliveryEnv } from './load-dev-delivery-env';

loadDevDeliveryEnv();

const EXTRA_CODES = ['LMS_COURSES', 'MKT_SELLER_CABINET', 'POS_RECEIPT', 'TKT_ISSUE'] as const;
const SAMPLE_TYPES = ['LMS', 'BOS', 'POS', 'SAAS', 'MOBILE_APP'] as const;
const RETIRED_KEYS = ['saas-code', 'mobile-app-code'] as const;

async function main(): Promise<void> {
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  const codes = DELIVERY_CATALOG_SEED_ITEMS.map((item) => item.code);
  const keys = buildSeededProfileKeys();
  try {
    const snapshot = {
      catalog: codes.length,
      functions: await prisma.deliveryFunction.groupBy({
        by: ['status'],
        where: { code: { in: codes } },
        _count: true,
      }),
      cores: await prisma.deliveryBaseProfileVersion.groupBy({
        by: ['status'],
        where: { profileKey: { in: keys } },
        _count: true,
      }),
      extras: await prisma.deliveryFunction.findMany({
        where: { code: { in: [...EXTRA_CODES] } },
        select: {
          code: true,
          status: true,
          contentVersions: {
            take: 1,
            orderBy: { version: 'desc' },
            select: { publishedAt: true },
          },
        },
      }),
      types: await prisma.systemListOption.findMany({
        where: { listKey: 'PRODUCT_TYPE', code: { in: [...SAMPLE_TYPES] } },
        select: { code: true, isActive: true },
      }),
      typeCount: await prisma.systemListOption.count({
        where: { listKey: 'PRODUCT_TYPE', isActive: true },
      }),
      learning: await prisma.deliveryFunction.count({
        where: { category: 'learning', status: 'ACTIVE' },
      }),
      publishedPrices: await prisma.deliveryFunctionPriceVersion.count({
        where: { status: 'PUBLISHED', function: { code: { in: codes } } },
      }),
      draftPrices: await prisma.deliveryFunctionPriceVersion.count({
        where: { status: 'DRAFT', function: { code: { in: codes } } },
      }),
      retired: await prisma.deliveryBaseProfileVersion.findMany({
        where: { profileKey: { in: [...RETIRED_KEYS] } },
        select: { profileKey: true, status: true },
      }),
    };
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
