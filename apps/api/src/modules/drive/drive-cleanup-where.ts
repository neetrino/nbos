import type { Prisma } from '@nbos/database';
import {
  DRIVE_TASK_ATTACHMENT_RETENTION_MS,
  DRIVE_TRASH_RETENTION_MS,
  DRIVE_ZIP_EXPORT_ARTIFACT_TTL_MS,
} from './drive-zip-export.constants';

export function orphanFileWhere(): Prisma.FileAssetWhereInput {
  return {
    deletedAt: null,
    status: { in: ['ACTIVE', 'APPROVED', 'DRAFT'] },
    links: { none: { unlinkedAt: null } },
    folderPlacements: { none: { removedAt: null } },
  };
}

export function failedUploadSessionWhere(): Prisma.FileUploadSessionWhereInput {
  return { status: 'FAILED' };
}

export function expiredPendingUploadSessionWhere(now: Date): Prisma.FileUploadSessionWhereInput {
  return { status: 'PENDING', expiresAt: { lt: now } };
}

export function temporaryExportFileWhere(now: Date): Prisma.FileAssetWhereInput {
  const cutoff = new Date(now.getTime() - DRIVE_ZIP_EXPORT_ARTIFACT_TTL_MS);
  return {
    deletedAt: null,
    driveZipExportOutputs: {
      some: {
        status: 'COMPLETED',
        completedAt: { lt: cutoff },
      },
    },
  };
}

export function softDeletedRetentionWhere(now: Date): Prisma.FileAssetWhereInput {
  const cutoff = new Date(now.getTime() - DRIVE_TRASH_RETENTION_MS);
  return { status: 'DELETED', deletedAt: { lt: cutoff } };
}

/** Trash past retention with no blocking relations — safe for hard purge + R2 delete. */
export function purgeableSoftDeletedRetentionWhere(now: Date): Prisma.FileAssetWhereInput {
  return {
    AND: [
      softDeletedRetentionWhere(now),
      { documentAttachments: { none: {} } },
      { emailAttachments: { none: {} } },
      { messengerChannelAttachments: { none: {} } },
      { messengerDirectAttachments: { none: {} } },
      { links: { none: { unlinkedAt: null } } },
    ],
  };
}

export function oldTaskAttachmentLinkWhere(now: Date): Prisma.FileLinkWhereInput {
  const cutoff = new Date(now.getTime() - DRIVE_TASK_ATTACHMENT_RETENTION_MS);
  return {
    entityType: 'TASK',
    unlinkedAt: null,
    linkedAt: { lt: cutoff },
  };
}

export function duplicateChecksumFileWhere(checksums: string[]): Prisma.FileAssetWhereInput {
  return {
    deletedAt: null,
    checksum: { in: checksums },
  };
}
