import type { Logger } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import type { DriveR2Client } from './drive-r2.client';
import { purgeableSoftDeletedRetentionWhere } from './drive-cleanup-where';
import { purgeRetentionFileAssets } from './drive-retention-purge.ops';

export const DRIVE_TRASH_RETENTION_PURGE_BATCH_CAP = 100;

export interface DriveTrashRetentionPurgeResult {
  purged: number;
  candidateIds: string[];
}

/** Batch-purges Drive trash file assets past retention (R2 + DB). */
export async function purgeDriveTrashRetentionBatch(
  prisma: InstanceType<typeof PrismaClient>,
  r2: DriveR2Client,
  logger: Pick<Logger, 'warn'>,
  now: Date,
  retentionMs?: number,
): Promise<DriveTrashRetentionPurgeResult> {
  const where = purgeableSoftDeletedRetentionWhere(now, retentionMs);
  const candidates = await prisma.fileAsset.findMany({
    where,
    select: { id: true },
    orderBy: { deletedAt: 'asc' },
    take: DRIVE_TRASH_RETENTION_PURGE_BATCH_CAP,
  });
  if (candidates.length === 0) {
    return { purged: 0, candidateIds: [] };
  }

  const candidateIds = candidates.map((row) => row.id);
  const purged = await purgeRetentionFileAssets(prisma, r2, logger, candidateIds, now, retentionMs);
  return { purged, candidateIds: candidateIds.slice(0, purged) };
}
