import type { PrismaClient } from '@nbos/database';
import type { AccessibleFileAssetStorage } from '../../drive/drive-accessible-file.op';

/**
 * Loads the Call's recording FileAsset after object-level Call view already passed.
 * Drive listing filters and DRIVE_VIEW are not applied: hearing this recording follows
 * Call view, and a RESTRICTED owner filter would 404 a seller-owned file for a manager.
 */
export async function findCallRecordingStorage(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
): Promise<AccessibleFileAssetStorage | null> {
  return prisma.fileAsset.findFirst({
    where: { id: fileAssetId, deletedAt: null, purpose: 'CALL_RECORDING' },
    select: { storageKey: true, mimeType: true, sizeBytes: true },
  });
}
