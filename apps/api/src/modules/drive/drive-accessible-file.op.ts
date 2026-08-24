import type { PrismaClient } from '@nbos/database';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import type { DriveEntityAccess } from './drive-access.types';

export type AccessibleFileAssetStorage = {
  storageKey: string | null;
  mimeType: string | null;
  sizeBytes: bigint | null;
};

/**
 * Applies the existing Drive FileAsset access filter (visibility, confidentiality,
 * origin, grant, inherited links) to one asset. Does not fetch object bytes.
 */
export async function findAccessibleFileAssetStorage(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  access: DriveEntityAccess,
): Promise<AccessibleFileAssetStorage | null> {
  const accessWhere = await buildDriveAssetAccessWhere(prisma, access);
  return prisma.fileAsset.findFirst({
    where: { id: fileAssetId, deletedAt: null, ...accessWhere },
    select: { storageKey: true, mimeType: true, sizeBytes: true },
  });
}
