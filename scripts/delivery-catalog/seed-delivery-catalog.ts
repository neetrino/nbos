import { createPrismaClient, type PrismaClient } from '@nbos/database';
import { loadDeliveryEnv } from '../delivery-dev/load-dev-delivery-env';
import { resolveSeedAuthorId } from '../delivery-dev/resolve-seed-author';
import {
  SEED_ACCEPTANCE_PLACEHOLDER,
  SEED_INSTRUCTIONS_PLACEHOLDER,
  type DeliveryCatalogSeedItem,
} from './delivery-catalog-seed-data';
import { formatSeedPlan, planDeliveryCatalogSeed } from './plan-delivery-catalog-seed';
import { buildSeedRoleUnits } from './build-seed-role-units';
import { syncCatalogTierProductTypes } from './sync-catalog-tier-types';

loadDeliveryEnv();

const FIRST_CONTENT_VERSION = 1;
const FIRST_PRICE_VERSION = 1;
const FIRST_TIER_POSITION = 1;
const APPLY_FLAG = '--apply';
const UPDATE_COPY_FLAG = '--update-copy';
const UPDATE_TIERS_FLAG = '--update-tiers';
const AUTHOR_FLAG = '--author=';

/**
 * Creates the draft delivery catalog. Dry run by default; `--apply` writes.
 * Everything created is DRAFT and nothing is published. Existing codes stay untouched unless
 * `--update-copy` explicitly requests copy-only updates.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const updateCopy = process.argv.includes(UPDATE_COPY_FLAG);
  const updateTiers = process.argv.includes(UPDATE_TIERS_FLAG);
  const authorId = readAuthorId();
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const existing = await prisma.deliveryFunction.findMany({ select: { id: true, code: true } });
    const plan = planDeliveryCatalogSeed(existing, { updateCopy });
    process.stdout.write(`${formatSeedPlan(plan, apply)}\n`);
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to write these rows.\n`);
      return;
    }
    const author = plan.createCount > 0 ? await resolveSeedAuthorId(prisma, authorId) : null;
    for (const entry of plan.entries) {
      if (entry.action === 'KEEP') continue;
      if (entry.action === 'UPDATE_COPY') {
        await updateFunctionCopy(prisma, entry.existingId, entry.item);
        continue;
      }
      if (!author) throw new Error('Author is required to create catalog functions.');
      await createDraftFunction(prisma, entry.item, author);
    }
    let tierMappingsAdded = 0;
    if (updateTiers) {
      for (const entry of plan.entries) {
        tierMappingsAdded += await syncCatalogTierProductTypes(prisma, entry.item);
      }
    }
    process.stdout.write(
      `Created ${plan.createCount} draft catalog functions, updated copy for ${plan.updateCopyCount}, added ${tierMappingsAdded} tier type mappings.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

function readAuthorId(): string | null {
  const arg = process.argv.find((value) => value.startsWith(AUTHOR_FLAG));
  return arg ? arg.slice(AUTHOR_FLAG.length).trim() || null : null;
}

/**
 * Creates the card together with a DRAFT unit vector. Draft means exactly that: the numbers are a
 * proposal for the Owner to review in the norms screen, and nothing can be earned from them until
 * he publishes the version himself.
 */
async function createDraftFunction(
  prisma: PrismaClient,
  item: DeliveryCatalogSeedItem,
  authorId: string,
): Promise<void> {
  const created = await prisma.deliveryFunction.create({
    data: {
      code: item.code,
      category: item.category,
      iconKey: item.iconKey,
      status: 'DRAFT',
      authorId,
      contentVersions: {
        create: {
          version: FIRST_CONTENT_VERSION,
          title: item.title,
          summary: item.summary,
          scopeBoundaries: item.scopeBoundaries,
          instructions: SEED_INSTRUCTIONS_PLACEHOLDER,
          acceptanceCriteria: SEED_ACCEPTANCE_PLACEHOLDER,
          authorId,
        },
      },
    },
  });
  await createDraftPricing(prisma, item, created.id);
}

async function updateFunctionCopy(
  prisma: PrismaClient,
  functionId: string,
  item: DeliveryCatalogSeedItem,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const latestContent = await tx.deliveryFunctionContentVersion.findFirst({
      where: { functionId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (!latestContent) {
      throw new Error(`Delivery function ${item.code} has no content version to update.`);
    }
    await tx.deliveryFunctionContentVersion.update({
      where: { id: latestContent.id },
      data: {
        title: item.title,
        summary: item.summary,
        scopeBoundaries: item.scopeBoundaries,
        instructions: SEED_INSTRUCTIONS_PLACEHOLDER,
        acceptanceCriteria: SEED_ACCEPTANCE_PLACEHOLDER,
      },
    });
    for (const tier of item.tiers ?? []) {
      await tx.deliveryFunctionTier.updateMany({
        where: { functionId, code: tier.code },
        data: { label: tier.label },
      });
    }
  });
}

/**
 * Units are attached either to the card itself or to each of its gradations, never to both. A tiered
 * card gets one draft version per gradation, so the Owner reviews the volumes separately and the
 * server can price a selection by the gradation it resolved.
 */
async function createDraftPricing(
  prisma: PrismaClient,
  item: DeliveryCatalogSeedItem,
  functionId: string,
): Promise<void> {
  if (!item.tiers) {
    await prisma.deliveryFunctionPriceVersion.create({
      data: {
        functionId,
        version: FIRST_PRICE_VERSION,
        status: 'DRAFT',
        effectiveFrom: new Date(),
        roleUnits: { create: buildSeedRoleUnits(item.units ?? {}) },
      },
    });
    return;
  }
  let version = FIRST_PRICE_VERSION;
  let position = FIRST_TIER_POSITION;
  for (const tier of item.tiers) {
    const created = await prisma.deliveryFunctionTier.create({
      data: {
        functionId,
        code: tier.code,
        label: tier.label,
        position,
        productTypes: { create: tier.productTypes.map((productType) => ({ productType })) },
      },
    });
    await prisma.deliveryFunctionPriceVersion.create({
      data: {
        functionId,
        tierId: created.id,
        version,
        status: 'DRAFT',
        effectiveFrom: new Date(),
        roleUnits: { create: buildSeedRoleUnits(tier.units) },
      },
    });
    version += 1;
    position += 1;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
