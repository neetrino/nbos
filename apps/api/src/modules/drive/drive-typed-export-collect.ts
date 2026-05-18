import type { FilePurposeEnum, Prisma, PrismaClient } from '@nbos/database';
import type { DriveEntityContextAccess } from './drive-access.types';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import { DRIVE_ZIP_EXPORT_MAX_FILES } from './drive-zip-export.constants';

export type DriveExportLinkTarget = { entityType: string; entityId: string };

export interface DriveExportCollectOptions {
  purposes?: readonly FilePurposeEnum[];
  includeArchived?: boolean;
}

export async function collectAccessibleExportFileIds(
  prisma: InstanceType<typeof PrismaClient>,
  linkTargets: DriveExportLinkTarget[],
  access: DriveEntityContextAccess,
  options?: DriveExportCollectOptions,
): Promise<string[]> {
  if (linkTargets.length === 0) return [];
  const accessWhere = await buildDriveAssetAccessWhere(prisma, access);
  const linkWhere: Prisma.FileLinkWhereInput = {
    unlinkedAt: null,
    OR: linkTargets.map((target) => ({
      entityType: target.entityType,
      entityId: target.entityId,
    })),
  };
  const statusWhere: Prisma.FileAssetWhereInput = options?.includeArchived
    ? { status: { in: ['ACTIVE', 'ARCHIVED', 'APPROVED', 'DRAFT'] } }
    : { deletedAt: null };
  const purposeWhere: Prisma.FileAssetWhereInput =
    options?.purposes && options.purposes.length > 0
      ? { purpose: { in: [...options.purposes] } }
      : {};

  const rows = await prisma.fileAsset.findMany({
    where: {
      ...statusWhere,
      ...purposeWhere,
      ...accessWhere,
      links: { some: linkWhere },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: DRIVE_ZIP_EXPORT_MAX_FILES,
  });
  return rows.map((row) => row.id);
}
