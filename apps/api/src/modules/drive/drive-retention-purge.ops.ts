import type { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { DriveR2Client } from './drive-r2.client';
import { purgeableSoftDeletedRetentionWhere } from './drive-cleanup-where';
import { collectFileAssetR2StorageKeys, deleteR2StorageKeys } from './drive-r2-storage-purge.ops';

/** Hard-purges trash file assets past retention: R2 delete then DB row removal. */
export async function purgeRetentionFileAssets(
  prisma: InstanceType<typeof PrismaClient>,
  r2: DriveR2Client,
  logger: Pick<Logger, 'warn'>,
  ids: string[],
  now: Date,
  retentionMs?: number,
): Promise<number> {
  const where = { id: { in: ids }, ...purgeableSoftDeletedRetentionWhere(now, retentionMs) };
  const rows = await prisma.fileAsset.findMany({
    where,
    select: {
      id: true,
      storageProvider: true,
      storageKey: true,
      versions: { select: { storageKey: true } },
    },
  });
  if (rows.length === 0) return 0;

  const purgedIds: string[] = [];
  for (const row of rows) {
    const keys = collectFileAssetR2StorageKeys(row);
    if (keys.length > 0) {
      const { failed } = await deleteR2StorageKeys(r2, keys, logger);
      if (failed > 0) continue;
    }
    purgedIds.push(row.id);
  }
  if (purgedIds.length === 0) return 0;

  const result = await prisma.fileAsset.deleteMany({
    where: { id: { in: purgedIds } },
  });
  return result.count;
}
