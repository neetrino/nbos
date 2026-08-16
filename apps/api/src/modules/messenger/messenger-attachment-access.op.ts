import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { assertDriveFileActionAllowed } from '../drive/drive-file-action-guard.op';
import type { DriveEntityAccess } from '../drive/drive-access.types';
import type { MessengerLegacyAccessContext } from './access/messenger-legacy-channel-access.op';

/**
 * Ensures each FileAsset id exists and the actor may LINK it (attach to messenger message).
 * Throws NotFound/Forbidden from Drive policy; BadRequest when empty after dedupe is skipped by caller.
 */
export async function assertMessengerFileAssetsAttachable(
  prisma: InstanceType<typeof PrismaClient>,
  access: MessengerLegacyAccessContext,
  fileAssetIds: string[] | undefined,
): Promise<string[]> {
  const uniqueIds = [...new Set(fileAssetIds?.map((id) => id.trim()).filter(Boolean) ?? [])];
  if (uniqueIds.length === 0) return [];

  const driveAccess: DriveEntityAccess = {
    employeeId: access.employeeId,
    departmentIds: access.departmentIds,
    driveScope: access.driveViewScope,
  };

  for (const fileAssetId of uniqueIds) {
    try {
      await assertDriveFileActionAllowed(prisma, fileAssetId, driveAccess, 'LINK');
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ForbiddenException) {
        throw err;
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new ForbiddenException('File attachment not allowed.');
    }
  }
  return uniqueIds;
}

export async function assertActiveEmployeeRecipient(
  prisma: InstanceType<typeof PrismaClient>,
  recipientId: string,
): Promise<void> {
  const emp = await prisma.employee.findUnique({
    where: { id: recipientId },
    select: { id: true, status: true },
  });
  if (!emp || emp.status === 'TERMINATED') {
    throw new NotFoundException('Recipient not found');
  }
}
