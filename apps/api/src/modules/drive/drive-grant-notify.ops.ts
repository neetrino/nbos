import { randomUUID } from 'node:crypto';
import type { Logger } from '@nestjs/common';
import type { InputJsonValue, PrismaClient } from '@nbos/database';
import { NotificationService } from '../notifications/notification.service';
import type { FileGrantPermission } from './drive-grant-permissions';

/** Must match `DRIVE_DEEP_LINK_OPEN_FILE_ID_QUERY` in `apps/web/.../drive-deep-link.ts`. */
const DRIVE_OPEN_FILE_QUERY = 'driveOpenFileId';

const DRIVE_GRANT_NOTIFY_SOURCE = 'drive';

const PERMISSION_LABEL: Record<FileGrantPermission, string> = {
  VIEW: 'view',
  EDIT_METADATA: 'edit details',
  UPLOAD_VERSION: 'upload new versions',
  SHARE: 'share further',
  DELETE: 'delete',
  EXPORT: 'export',
};

function buildDriveOpenFileLink(fileAssetId: string): string {
  const params = new URLSearchParams();
  params.set(DRIVE_OPEN_FILE_QUERY, fileAssetId);
  return `/drive?${params.toString()}`;
}

function formatEmployeeLabel(firstName: string | null, lastName: string | null): string {
  const parts = [firstName?.trim() ?? '', lastName?.trim() ?? ''].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'A colleague';
}

/**
 * Sends an in-app notification to the grantee when Drive file access is granted or changed.
 * Failures are logged; callers should not block grant persistence on this.
 */
export async function notifyDriveFileGrantRecipient(params: {
  prisma: InstanceType<typeof PrismaClient>;
  notifications: NotificationService;
  logger: Logger;
  kind: 'created' | 'updated';
  fileAssetId: string;
  grantId: string;
  granteeEmployeeId: string;
  actorId: string;
  permission: FileGrantPermission;
}): Promise<void> {
  const {
    prisma,
    notifications,
    logger,
    kind,
    fileAssetId,
    grantId,
    granteeEmployeeId,
    actorId,
    permission,
  } = params;

  try {
    const [fileRow, actor] = await Promise.all([
      prisma.fileAsset.findUnique({
        where: { id: fileAssetId },
        select: { displayName: true },
      }),
      prisma.employee.findUnique({
        where: { id: actorId },
        select: { firstName: true, lastName: true },
      }),
    ]);

    const fileLabel = fileRow?.displayName?.trim() || 'a file';
    const who = formatEmployeeLabel(actor?.firstName ?? null, actor?.lastName ?? null);
    const perm = PERMISSION_LABEL[permission];
    const isCreated = kind === 'created';
    const title = isCreated ? 'Drive: file shared with you' : 'Drive: your access was updated';
    const body = isCreated
      ? `${who} shared “${fileLabel}” with you (${perm}).`
      : `${who} updated your access to “${fileLabel}” (${perm}).`;
    const type = isCreated ? 'drive.file_grant_created' : 'drive.file_grant_updated';
    const nonce = randomUUID();
    const payload: InputJsonValue = {
      kind,
      fileAssetId,
      grantId,
      permission,
    };

    await notifications.create({
      type,
      recipientId: granteeEmployeeId,
      title,
      body,
      link: buildDriveOpenFileLink(fileAssetId),
      actionLabel: 'Open in Drive',
      entityType: 'FileAsset',
      entityId: fileAssetId,
      sourceModule: DRIVE_GRANT_NOTIFY_SOURCE,
      dedupeKey: isCreated
        ? `drive.grant.created:${grantId}`
        : `drive.grant.updated:${grantId}:${nonce}`,
      idempotencyKey: isCreated
        ? `drive.grant.created:${grantId}`
        : `drive.grant.updated:${grantId}:${nonce}`,
      payload,
    });
  } catch (err) {
    logger.warn(`drive_grant_notify_failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
