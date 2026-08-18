import type { ConfigService } from '@nestjs/config';
import type { PrismaClient } from '@nbos/database';
import type { DriveService } from '../drive/drive.service';
import { MAIL_ATTACHMENT_MAX_BYTES } from './mail-attachment.constants';
import {
  isStoredAttachmentOversize,
  loadAttachmentDownloadRow,
  markAttachmentFailed,
  markAttachmentReady,
  type MailAttachmentDownloadRow,
} from './mail-attachment-download.ops';
import type { MailAttachmentDownloadResult } from './mail-attachment-download.types';
import { storeInboundAttachmentFileAsset } from './mail-attachment-store.ops';
import {
  classifyMailProviderError,
  MailAttachmentPermanentError,
} from './mail-provider-error.classify';
import { markMailboxNeedsReconnect } from './mail-send-outcome.ops';
import type { MailProviderAdapterFactory } from './providers/mail-provider-adapter.factory';
import type { ConnectionForAdapter } from './providers/mail-provider-adapter.factory';

export async function executeAttachmentDownload(params: {
  prisma: InstanceType<typeof PrismaClient>;
  adapterFactory: MailProviderAdapterFactory;
  driveService: DriveService;
  config: ConfigService;
  messageId: string;
  attachmentId: string;
  logError: (message: string) => void;
  logWarn: (message: string) => void;
}): Promise<MailAttachmentDownloadResult> {
  const row = await loadAttachmentDownloadRow(params.prisma, params.attachmentId);
  if (!row || row.messageId !== params.messageId || row.downloadStatus === 'READY') {
    return {};
  }
  const status = row.message.mailAccount.status;
  if (status === 'PAUSED' || status === 'DISABLED') {
    return {};
  }
  if (isStoredAttachmentOversize(row.sizeBytes)) {
    await markAttachmentFailed(params.prisma, params.attachmentId);
    return { errorClass: 'permanent' };
  }
  try {
    await downloadAndStore(params, row);
    return {};
  } catch (error) {
    return handleDownloadError(params, row, error);
  }
}

async function downloadAndStore(
  params: {
    prisma: InstanceType<typeof PrismaClient>;
    adapterFactory: MailProviderAdapterFactory;
    driveService: DriveService;
    config: ConfigService;
    logWarn: (message: string) => void;
  },
  row: MailAttachmentDownloadRow,
): Promise<void> {
  const downloaded = await fetchProviderBytes(params.adapterFactory, row);
  if (downloaded.content.byteLength > MAIL_ATTACHMENT_MAX_BYTES) {
    params.logWarn(`Mail attachment oversize attachmentId=${row.id}`);
    await markAttachmentFailed(params.prisma, row.id);
    return;
  }
  const fileAssetId = await storeInboundAttachmentFileAsset({
    drive: params.driveService,
    config: params.config,
    attachmentId: row.id,
    messageId: row.messageId,
    fileName: row.fileName || downloaded.filename,
    mimeType: row.mimeType ?? downloaded.contentType,
    content: downloaded.content,
    ownerId: row.message.mailAccount.ownerEmployeeId,
  });
  await markAttachmentReady(params.prisma, row.id, fileAssetId, downloaded.content.byteLength);
}

async function fetchProviderBytes(
  adapterFactory: MailProviderAdapterFactory,
  row: MailAttachmentDownloadRow,
) {
  const account = row.message.mailAccount;
  const connection = account.providerConnection;
  if (!connection) {
    throw new MailAttachmentPermanentError('Mailbox has no provider connection');
  }
  const providerMessageId = row.message.providerMessageId;
  const providerAttachmentId = row.providerAttachmentId;
  if (!providerMessageId || !providerAttachmentId) {
    throw new MailAttachmentPermanentError('Attachment is missing provider ids');
  }
  const adapter = await adapterFactory.forConnection(toConnectionInput(account, connection));
  return adapter.downloadAttachment({ providerMessageId, providerAttachmentId });
}

async function handleDownloadError(
  params: {
    prisma: InstanceType<typeof PrismaClient>;
    logError: (message: string) => void;
  },
  row: MailAttachmentDownloadRow,
  error: unknown,
): Promise<MailAttachmentDownloadResult> {
  const errorClass = classifyMailProviderError(error);
  const detail = error instanceof Error ? error.message : 'unknown error';
  params.logError(`Mail attachment ${errorClass} attachmentId=${row.id}: ${detail}`);
  if (errorClass === 'transient') {
    throw error;
  }
  await markAttachmentFailed(params.prisma, row.id);
  if (errorClass === 'auth') {
    await markMailboxNeedsReconnect(params.prisma, row.message.mailAccountId, detail);
  }
  return { errorClass };
}

function toConnectionInput(
  account: MailAttachmentDownloadRow['message']['mailAccount'],
  connection: NonNullable<
    MailAttachmentDownloadRow['message']['mailAccount']['providerConnection']
  >,
): ConnectionForAdapter {
  return {
    mailAccountId: account.id,
    emailAddress: account.emailAddress,
    displayName: account.displayName,
    providerType: account.providerType,
    username: connection.username,
    imapHost: connection.imapHost,
    imapPort: connection.imapPort,
    secureMode: connection.secureMode,
    smtpHost: connection.smtpHost,
    smtpPort: connection.smtpPort,
    smtpSecureMode: connection.smtpSecureMode,
  };
}
