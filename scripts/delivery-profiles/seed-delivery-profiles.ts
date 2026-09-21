import { createPrismaClient, type PrismaClient, type TransactionClient } from '@nbos/database';
import { loadDevDeliveryEnv } from '../delivery-dev/load-dev-delivery-env';
import { buildSeedRoleUnits } from '../delivery-catalog/build-seed-role-units';
import {
  buildSeededProfileKeys,
  retiredSizedProfileKeys,
  seededCollections,
  SEED_DESIGN_MODE,
  SEED_ENTITY_KIND,
  SEED_IMPLEMENTATION_BASE,
  type ProfileSeedVersion,
} from './delivery-profiles-seed-data';
import { formatProfileSeedPlan, planDeliveryProfilesSeed } from './plan-delivery-profiles-seed';

loadDevDeliveryEnv();

const FIRST_PROFILE_VERSION = 1;
const APPLY_FLAG = '--apply';
const REPLACE_FLAG = '--replace-drafts';

/**
 * Creates one draft core per product kind and named extra-function collections. Dry run by default.
 * `--replace-drafts` rewrites still-proposal content and drops unused sized draft keys.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const replaceDrafts = process.argv.includes(REPLACE_FLAG);
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const ownedKeys = [...buildSeededProfileKeys(), ...retiredSizedProfileKeys()];
    const [profiles, functions] = await Promise.all([
      prisma.deliveryBaseProfileVersion.findMany({
        where: { profileKey: { in: ownedKeys } },
        select: {
          profileKey: true,
          status: true,
          _count: { select: { configurations: true } },
        },
      }),
      prisma.deliveryFunction.findMany({ select: { id: true, code: true } }),
    ]);
    const plan = planDeliveryProfilesSeed(
      profiles.map((row) => ({
        profileKey: row.profileKey,
        status: row.status,
        configurationCount: row._count.configurations,
      })),
      functions.map((row) => row.code),
      { replaceDrafts },
    );
    process.stdout.write(`${formatProfileSeedPlan(plan, apply)}\n`);
    if (plan.missingFunctionCodes.length > 0) {
      throw new Error(
        'Seed the function catalog first: profiles reference codes it does not have.',
      );
    }
    if (!apply) {
      process.stdout.write(`Re-run with ${APPLY_FLAG} to write these rows.\n`);
      return;
    }
    const functionIdByCode = new Map(functions.map((row) => [row.code, row.id]));
    for (const retired of plan.retired) {
      if (retired.action === 'RETIRE') {
        await dropDraftProfile(prisma, retired.profileKey);
      }
    }
    for (const entry of plan.entries) {
      if (entry.action === 'KEEP') continue;
      await writeDraftProfile(prisma, entry.version, functionIdByCode, entry.action === 'REPLACE');
    }
    await seedCollections(prisma, functionIdByCode);
    process.stdout.write(
      `Created ${plan.createCount}, replaced ${plan.replaceCount}, retired ${plan.retireCount}.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function writeDraftProfile(
  prisma: PrismaClient,
  version: ProfileSeedVersion,
  functionIdByCode: ReadonlyMap<string, string>,
  replaceExisting: boolean,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (replaceExisting) {
      await dropDraftProfile(tx, version.profileKey);
    }
    await writeProfileVersion(tx, version, functionIdByCode);
  });
}

async function dropDraftProfile(
  db: PrismaClient | TransactionClient,
  profileKey: string,
): Promise<void> {
  const removed = await db.deliveryBaseProfileVersion.deleteMany({
    where: { profileKey, status: 'DRAFT' },
  });
  if (removed.count === 0) {
    throw new Error(`Refusing to replace ${profileKey}: it is no longer a draft.`);
  }
}

async function writeProfileVersion(
  tx: TransactionClient,
  version: ProfileSeedVersion,
  functionIdByCode: ReadonlyMap<string, string>,
): Promise<void> {
  const { kind } = version;
  await tx.deliveryBaseProfileVersion.create({
    data: {
      profileKey: version.profileKey,
      version: FIRST_PROFILE_VERSION,
      entityKind: SEED_ENTITY_KIND,
      productType: kind.productType,
      productCategory: kind.productCategory,
      implementationBase: SEED_IMPLEMENTATION_BASE,
      designMode: SEED_DESIGN_MODE,
      description: kind.description,
      status: 'DRAFT',
      effectiveFrom: new Date(),
      roleUnits: { create: buildSeedRoleUnits(version.units) },
      coreItems: {
        create: kind.coreItems.map((item, index) => ({
          position: index + 1,
          label: item.label,
          note: item.note ?? null,
        })),
      },
      includedFunctions: {
        create: kind.includedFunctionCodes.map((code) => ({
          functionId: requireFunctionId(functionIdByCode, code),
        })),
      },
    },
  });
}

async function seedCollections(
  prisma: PrismaClient,
  functionIdByCode: ReadonlyMap<string, string>,
): Promise<void> {
  for (const { productType, collection } of seededCollections()) {
    const existing = await prisma.deliveryFunctionCollection.findUnique({
      where: { productType_name: { productType, name: collection.name } },
      select: { id: true },
    });
    if (existing) continue;
    const last = await prisma.deliveryFunctionCollection.findFirst({
      where: { productType },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    await prisma.deliveryFunctionCollection.create({
      data: {
        productType,
        name: collection.name,
        position: (last?.position ?? 0) + 1,
        items: {
          create: collection.functionCodes.map((code, index) => ({
            functionId: requireFunctionId(functionIdByCode, code),
            position: index + 1,
          })),
        },
      },
    });
  }
}

function requireFunctionId(byCode: ReadonlyMap<string, string>, code: string): string {
  const id = byCode.get(code);
  if (!id) {
    throw new Error(`Catalog function ${code} not found. Run pnpm seed:delivery-catalog first.`);
  }
  return id;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
