import type { PrismaClient, TransactionClient } from '@nbos/database';
import {
  LEGACY_SEEDED_COLLECTION_NAMES,
  SEEDED_COLLECTION_NAMES,
  type ProfileSeedKind,
} from './data/profile-seed-types';
import type { ProfileSeedVersion } from './delivery-profiles-seed-data';

/**
 * Rewrites published or draft copy only: description, core-item labels, and kit names.
 * Units, included functions, and kit membership stay untouched.
 */
export async function updateProfileCopy(
  prisma: PrismaClient,
  version: ProfileSeedVersion,
): Promise<void> {
  const rows = await prisma.deliveryBaseProfileVersion.findMany({
    where: { profileKey: version.profileKey },
    select: { id: true, coreItems: { orderBy: { position: 'asc' }, select: { id: true } } },
  });
  if (rows.length === 0) {
    throw new Error(`Profile ${version.profileKey} has no version to update.`);
  }
  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.deliveryBaseProfileVersion.update({
        where: { id: row.id },
        data: { description: version.kind.description },
      });
      await writeCoreItemCopy(tx, row.coreItems, version.kind.coreItems);
    }
  });
}

export async function renameLegacySeededCollections(prisma: PrismaClient): Promise<number> {
  let renamed = 0;
  for (const key of Object.keys(SEEDED_COLLECTION_NAMES) as Array<
    keyof typeof SEEDED_COLLECTION_NAMES
  >) {
    const result = await prisma.deliveryFunctionCollection.updateMany({
      where: { name: LEGACY_SEEDED_COLLECTION_NAMES[key] },
      data: { name: SEEDED_COLLECTION_NAMES[key] },
    });
    renamed += result.count;
  }
  return renamed;
}

async function writeCoreItemCopy(
  tx: TransactionClient,
  existing: ReadonlyArray<{ id: string }>,
  items: ProfileSeedKind['coreItems'],
): Promise<void> {
  const count = Math.min(existing.length, items.length);
  for (let index = 0; index < count; index += 1) {
    const row = existing[index];
    const item = items[index];
    if (!row || !item) continue;
    await tx.deliveryBaseProfileCoreItem.update({
      where: { id: row.id },
      data: { label: item.label, note: item.note ?? null },
    });
  }
}
