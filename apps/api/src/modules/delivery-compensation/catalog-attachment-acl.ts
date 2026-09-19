import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { buildDriveAssetAccessWhere } from '../drive/drive-asset-access.where';
import type { DriveEntityAccess } from '../drive/drive-access.types';

const FORBIDDEN_VISIBILITY = new Set([
  'PERSONAL',
  'RESTRICTED',
  'CLIENT_VISIBLE',
  'PARTNER_VISIBLE',
]);

const FORBIDDEN_CONFIDENTIALITY = new Set([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

/**
 * Catalog instructions are company-readable. A private or personal file must not become
 * a company-wide attachment just because a content editor knows its id.
 */
export async function assertCatalogAttachmentAllowed(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetId: string,
  access: DriveEntityAccess,
): Promise<void> {
  const accessWhere = await buildDriveAssetAccessWhere(prisma, access);
  const file = await prisma.fileAsset.findFirst({
    where: { id: fileAssetId, deletedAt: null, ...accessWhere },
    select: { visibility: true, confidentiality: true },
  });
  if (!file) {
    throw new NotFoundException('File asset not found');
  }
  if (FORBIDDEN_VISIBILITY.has(file.visibility)) {
    throw new ForbiddenException('Catalog attachments cannot use private or external files');
  }
  if (FORBIDDEN_CONFIDENTIALITY.has(file.confidentiality)) {
    throw new ForbiddenException('Catalog attachments cannot use sensitive files');
  }

  const personalPlacement = await prisma.driveFolderItem.findFirst({
    where: {
      fileAssetId,
      removedAt: null,
      folder: { space: 'PERSONAL' },
    },
    select: { id: true },
  });
  if (personalPlacement) {
    throw new ForbiddenException('Personal Drive files cannot be attached to the catalog');
  }
}
