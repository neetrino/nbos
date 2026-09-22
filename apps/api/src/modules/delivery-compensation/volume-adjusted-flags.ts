import type { PrismaClient } from '@nbos/database';
import { isStandardVolumeFactor } from '@nbos/shared';

type FlagClient = Pick<InstanceType<typeof PrismaClient>, 'deliveryConfiguration'>;

/** True when a card's core or any added function is off the catalog standard. */
export async function volumeAdjustedByOwner(
  db: FlagClient,
  owner: 'productId' | 'extensionId',
  ids: readonly string[],
): Promise<Map<string, boolean>> {
  if (ids.length === 0) return new Map();
  const rows = await db.deliveryConfiguration.findMany({
    where: { [owner]: { in: [...ids] }, mode: 'V2' },
    select: {
      productId: true,
      extensionId: true,
      coreVolumeFactor: true,
      features: {
        where: { archivedAt: null, origin: 'EXTRA' },
        select: { volumeFactor: true },
      },
    },
  });
  const flags = new Map<string, boolean>();
  for (const row of rows) {
    const id = owner === 'productId' ? row.productId : row.extensionId;
    if (!id) continue;
    flags.set(id, rowAdjusted(row));
  }
  return flags;
}

function rowAdjusted(row: {
  coreVolumeFactor: { toString(): string };
  features: Array<{ volumeFactor: { toString(): string } }>;
}): boolean {
  if (!isStandard(row.coreVolumeFactor.toString())) return true;
  return row.features.some((feature) => !isStandard(feature.volumeFactor.toString()));
}

function isStandard(raw: string): boolean {
  return isStandardVolumeFactor(raw);
}
