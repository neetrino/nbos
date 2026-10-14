import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PrismaClient } from '@nbos/database';
import type { DriveR2Client } from '../drive/drive-r2.client';
import { attachmentContentDisposition } from './mail-attachment-content-disposition';
import { MAIL_ATTACHMENT_DOWNLOAD_URL_SECONDS } from './mail-attachment.constants';
import { fetchMailThreadMessageForEdit } from './mail-thread-message-access.ops';

export interface MailAttachmentDownloadUrl {
  url: string;
  fileName: string;
  mimeType: string | null;
}

type StoredAttachment = {
  fileName: string;
  mimeType: string | null;
  downloadStatus: string;
  fileAsset: {
    deletedAt: Date | null;
    storageProvider: string;
    storageKey: string | null;
    externalUrl: string | null;
    mimeType: string | null;
    versions: Array<{ storageKey: string | null }>;
  } | null;
};

/**
 * Short-lived URL for a READY attachment the caller can already read on the thread.
 * Mailbox access is the gate; Drive library ACL is not required.
 */
export async function createMailAttachmentDownloadUrl(params: {
  prisma: InstanceType<typeof PrismaClient>;
  r2: DriveR2Client;
  employeeId: string;
  accessScope: string;
  threadId: string;
  messageId: string;
  attachmentId: string;
}): Promise<MailAttachmentDownloadUrl> {
  await requireReadableMessage(params);
  const row = await loadStoredAttachment(params.prisma, params.messageId, params.attachmentId);
  return signStoredAttachment(params.r2, row);
}

async function requireReadableMessage(params: {
  prisma: InstanceType<typeof PrismaClient>;
  employeeId: string;
  accessScope: string;
  threadId: string;
  messageId: string;
}): Promise<void> {
  const access = await fetchMailThreadMessageForEdit(params.prisma, {
    threadId: params.threadId,
    messageId: params.messageId,
    employeeId: params.employeeId,
    accessScope: params.accessScope,
  });
  if (access.status === 'no_mailbox') {
    throw new NotFoundException('Thread not found');
  }
  if (access.status === 'no_message') {
    throw new NotFoundException('Message not found');
  }
}

async function loadStoredAttachment(
  prisma: InstanceType<typeof PrismaClient>,
  messageId: string,
  attachmentId: string,
): Promise<StoredAttachment> {
  const row = await prisma.emailAttachment.findFirst({
    where: { id: attachmentId, messageId },
    select: {
      fileName: true,
      mimeType: true,
      downloadStatus: true,
      fileAsset: {
        select: {
          deletedAt: true,
          storageProvider: true,
          storageKey: true,
          externalUrl: true,
          mimeType: true,
          versions: {
            where: { isCurrent: true },
            orderBy: { versionNumber: 'desc' },
            take: 1,
            select: { storageKey: true },
          },
        },
      },
    },
  });
  if (!row) {
    throw new NotFoundException('Attachment not found');
  }
  if (row.downloadStatus !== 'READY' || !row.fileAsset || row.fileAsset.deletedAt) {
    throw new BadRequestException('Attachment is not ready to download');
  }
  return row;
}

async function signStoredAttachment(
  r2: DriveR2Client,
  row: StoredAttachment,
): Promise<MailAttachmentDownloadUrl> {
  const asset = row.fileAsset;
  if (!asset) {
    throw new BadRequestException('Attachment is not ready to download');
  }
  const mimeType = row.mimeType ?? asset.mimeType;
  if (asset.storageProvider === 'EXTERNAL_URL' && asset.externalUrl) {
    return { url: asset.externalUrl, fileName: row.fileName, mimeType };
  }
  const key = asset.versions[0]?.storageKey ?? asset.storageKey;
  if (!key || asset.storageProvider !== 'R2') {
    throw new BadRequestException('Attachment file is not available');
  }
  const url = await getSignedUrl(
    r2.ensureS3(),
    new GetObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      ResponseContentType: mimeType ?? undefined,
      ResponseContentDisposition: attachmentContentDisposition(row.fileName),
    }),
    { expiresIn: MAIL_ATTACHMENT_DOWNLOAD_URL_SECONDS },
  );
  return { url, fileName: row.fileName, mimeType };
}
