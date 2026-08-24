import type { PrismaClient } from '@nbos/database';
import type { AccessibleFileAssetStorage } from '../../drive/drive-accessible-file.op';

/**
 * Loads the Call's recording FileAsset after Call view + PLAY already passed.
 * Drive listing filters (RESTRICTED owner-only) are not applied here: Head of Sales /
 * CEO can view the Call but would otherwise get 404 on a seller-owned recording.
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

export function hasDriveViewPermission(permissions: Record<string, string | undefined>): boolean {
  const scope = permissions.DRIVE_VIEW?.trim().toUpperCase();
  return Boolean(scope) && scope !== 'NONE';
}
