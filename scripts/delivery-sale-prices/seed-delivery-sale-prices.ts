import { createPrismaClient, type PrismaClient } from '@nbos/database';
import { loadDeliveryEnv } from '../delivery-dev/load-dev-delivery-env';
import { resolveSeedAuthorId } from '../delivery-dev/resolve-seed-author';
import {
  buildSalePriceTargetDrafts,
  resolveSalePriceTargets,
  type ResolvedSalePriceTarget,
} from './build-sale-price-targets';
import {
  formatSalePriceSeedPlan,
  planDeliverySalePricesSeed,
  type SalePriceSeedPlanEntry,
} from './plan-delivery-sale-prices-seed';

loadDeliveryEnv();

const FIRST_VERSION = 1;
const APPLY_FLAG = '--apply';
const AUTHOR_FLAG = '--author=';

/**
 * Publishes one whole-card sale amount per function and per gradation.
 * Amount is 5 000 AMD times the seeded units. Dry run by default.
 * An existing flat seed amount is updated. Units stay untouched.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const { targets, missing } = await loadTargets(prisma);
    if (missing.length > 0) {
      throw new Error(`Catalog is missing ${missing.join(', ')}. Seed the catalog first.`);
    }
    const existing = await prisma.deliverySalePriceVersion.findMany({
      select: { targetKey: true, amountPerUnit: true },
    });
    const plan = planDeliverySalePricesSeed(
      targets,
      existing.map((row) => ({
        targetKey: row.targetKey,
        amountPerUnit: row.amountPerUnit.toString(),
      })),
    );
    process.stdout.write(`${formatSalePriceSeedPlan(plan, apply)}\n`);
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to write these rows.\n`);
      return;
    }
    const author = await resolveSeedAuthorId(prisma, readAuthorId());
    await applyPlan(prisma, plan.entries, author);
    process.stdout.write(
      `Published ${plan.createCount} and updated ${plan.updateCount} sale prices.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function loadTargets(prisma: PrismaClient) {
  const [functions, tiers] = await Promise.all([
    prisma.deliveryFunction.findMany({ select: { id: true, code: true } }),
    prisma.deliveryFunctionTier.findMany({
      select: { id: true, code: true, function: { select: { code: true } } },
    }),
  ]);
  return resolveSalePriceTargets(
    buildSalePriceTargetDrafts(),
    functions,
    tiers.map((row) => ({ id: row.id, code: row.code, functionCode: row.function.code })),
  );
}

async function applyPlan(
  prisma: PrismaClient,
  entries: readonly SalePriceSeedPlanEntry[],
  authorId: string,
): Promise<void> {
  for (const entry of entries) {
    if (entry.action === 'KEEP') continue;
    if (entry.action === 'UPDATE') {
      await updatePublishedAmount(prisma, entry.item);
      continue;
    }
    await createPublishedSalePrice(prisma, entry.item, authorId);
  }
}

async function updatePublishedAmount(
  prisma: PrismaClient,
  item: ResolvedSalePriceTarget,
): Promise<void> {
  const updated = await prisma.deliverySalePriceVersion.updateMany({
    where: { targetKey: item.targetKey, status: 'PUBLISHED' },
    data: { amountPerUnit: item.amountPerUnit },
  });
  if (updated.count === 0) {
    throw new Error(`No published sale price to update for ${item.code}.`);
  }
}

async function createPublishedSalePrice(
  prisma: PrismaClient,
  item: ResolvedSalePriceTarget,
  authorId: string,
): Promise<void> {
  const now = new Date();
  await prisma.deliverySalePriceVersion.create({
    data: {
      targetKey: item.targetKey,
      functionId: item.functionId,
      tierId: item.tierId,
      version: FIRST_VERSION,
      status: 'PUBLISHED',
      effectiveFrom: now,
      amountPerUnit: item.amountPerUnit,
      publishedById: authorId,
      publishedAt: now,
    },
  });
}

function readAuthorId(): string | null {
  const arg = process.argv.find((value) => value.startsWith(AUTHOR_FLAG));
  return arg ? arg.slice(AUTHOR_FLAG.length).trim() || null : null;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
