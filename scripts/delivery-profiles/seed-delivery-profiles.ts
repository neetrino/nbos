import { createPrismaClient, type PrismaClient, type TransactionClient } from '@nbos/database';
import { buildSeedRoleUnits } from '../delivery-catalog/build-seed-role-units';
import {
  buildSeededProfileKeys,
  SEED_DESIGN_MODE,
  SEED_ENTITY_KIND,
  SEED_IMPLEMENTATION_BASE,
  type ProfileSeedVersion,
} from './delivery-profiles-seed-data';
import { formatProfileSeedPlan, planDeliveryProfilesSeed } from './plan-delivery-profiles-seed';

const FIRST_PROFILE_VERSION = 1;
const APPLY_FLAG = '--apply';
const REPLACE_FLAG = '--replace-drafts';

/**
 * Creates draft core profiles and their size presets. Dry run by default; `--apply` writes.
 * Everything is DRAFT: a draft profile pays nobody and cannot be selected, so the numbers stay a
 * proposal until the Owner publishes them himself in the norms screen.
 *
 * `--replace-drafts` rewrites content the seed itself put there while it is still a proposal. The
 * plan refuses to replace anything published or already frozen into a configuration, so correcting
 * a draft cannot reach a norm somebody is being paid against.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes(APPLY_FLAG);
  const replaceDrafts = process.argv.includes(REPLACE_FLAG);
  const prisma = createPrismaClient({ role: 'all', skipBudgetAssert: true });
  try {
    const [profiles, functions] = await Promise.all([
      prisma.deliveryBaseProfileVersion.findMany({
        where: { profileKey: { in: buildSeededProfileKeys() } },
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
    for (const entry of plan.entries) {
      if (entry.action === 'KEEP') continue;
      await writeDraftProfile(prisma, entry.version, functionIdByCode, entry.action === 'REPLACE');
    }
    process.stdout.write(
      `Created ${plan.createCount} and replaced ${plan.replaceCount} draft core profiles.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * One profile version carries the core composition, the per-role unit proposal and the list of
 * cards the core already pays for. Its size preset is a different model, because a preset is not
 * money: it only pre-checks a module in the constructor and is charged as an ordinary extra.
 *
 * Every write shares one transaction. A rerun matches on the profile key alone, so a profile left
 * behind without its preset would be reported as already present and never repaired.
 */
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
    await writeSizePreset(tx, version, functionIdByCode);
  });
}

/**
 * The plan has already established that this key is a draft no configuration froze. Core items,
 * role units and included functions cascade with the version row; the size preset is a separate
 * model keyed by profile and size, so it is removed explicitly.
 */
async function dropDraftProfile(tx: TransactionClient, profileKey: string): Promise<void> {
  await tx.deliveryConfigSizePreset.deleteMany({ where: { profileKey } });
  const removed = await tx.deliveryBaseProfileVersion.deleteMany({
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
      configSize: version.configSize,
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

async function writeSizePreset(
  tx: TransactionClient,
  version: ProfileSeedVersion,
  functionIdByCode: ReadonlyMap<string, string>,
): Promise<void> {
  await tx.deliveryConfigSizePreset.createMany({
    data: version.presetFunctionCodes.map((code) => ({
      profileKey: version.profileKey,
      configSize: version.configSize,
      functionId: requireFunctionId(functionIdByCode, code),
    })),
    skipDuplicates: true,
  });
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
