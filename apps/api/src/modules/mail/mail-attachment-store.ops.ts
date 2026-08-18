import { createHash } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import { MAIL_ATTACHMENT_STORAGE_CONTEXT } from './mail-attachment.constants';
import { DriveService } from '../drive/drive.service';
import { buildStorageHomeKey } from '../drive/drive-storage-home-path';
import { readTenantOrganizationId } from '../drive/drive-tenant';
import { sanitizeUploadBaseName } from '../drive/drive-upload-path';

export async function storeInboundAttachmentFileAsset(params: {
  drive: DriveService;
  config: ConfigService;
  attachmentId: string;
  messageId: string;
  fileName: string;
  mimeType: string | null;
  content: Buffer;
  ownerId: string | null;
}): Promise<string> {
  const orgId = readTenantOrganizationId(params.config);
  const safeFileName = `${params.attachmentId}-${sanitizeUploadBaseName(params.fileName)}`;
  const storageKey = buildStorageHomeKey(orgId, MAIL_ATTACHMENT_STORAGE_CONTEXT, safeFileName);
  const checksum = createHash('sha256').update(params.content).digest('hex');
  const contentType = params.mimeType ?? 'application/octet-stream';
  const created = await params.drive.createGeneratedFileAsset({
    displayName: params.fileName,
    originalName: params.fileName,
    purpose: 'OTHER',
    sourceModule: 'MAIL',
    ownerId: params.ownerId ?? undefined,
    createdById: params.ownerId ?? undefined,
    visibility: 'RESTRICTED',
    confidentiality: 'CONFIDENTIAL',
    storageKey,
    content: params.content,
    contentType,
    mimeType: contentType,
    checksum,
    link: {
      entityType: 'email_message',
      entityId: params.messageId,
      linkType: 'ATTACHMENT',
      linkedById: params.ownerId ?? undefined,
    },
  });
  const id = (created as { id?: string }).id;
  if (!id) {
    throw new Error('Drive FileAsset was not created for mail attachment');
  }
  return id;
}
