import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { PrismaClient } from '@nbos/database';
import type { DriveR2Client } from '../drive/drive-r2.client';
import { MailAttachmentLoadError } from './mail-provider-error.classify';
import type { SendMessageAttachment } from './providers/mail-provider-adapter';

type OutboundAttachmentRow = {
  id: string;
  fileName: string;
  mimeType: string | null;
  isInline: boolean;
  fileAsset: {
    storageKey: string | null;
    storageProvider: string;
    mimeType: string | null;
    versions: Array<{ storageKey: string | null }>;
  };
};

async function bufferFromR2Body(body: AsyncIterable<Uint8Array> | undefined): Promise<Buffer | null> {
  if (!body) {
    return null;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function readOutboundAttachmentBytes(
  r2: DriveR2Client,
  key: string,
  attachmentId: string,
): Promise<Buffer> {
  try {
    const response = await r2.ensureS3().send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }));
    const content = await bufferFromR2Body(response.Body as AsyncIterable<Uint8Array> | undefined);
    if (!content) {
      throw new MailAttachmentLoadError(
        `Outbound attachment ${attachmentId} has no bytes at R2 key ${key}`,
      );
    }
    return content;
  } catch (error) {
    if (error instanceof MailAttachmentLoadError) {
      throw error;
    }
    throw new MailAttachmentLoadError(`Failed to load outbound attachment ${attachmentId} from R2`, {
      cause: error,
    });
  }
}

async function loadOneOutboundAttachmentPart(
  r2: DriveR2Client,
  row: OutboundAttachmentRow,
  bodyHtml: string | null,
): Promise<SendMessageAttachment> {
  const key = row.fileAsset.versions[0]?.storageKey ?? row.fileAsset.storageKey;
  if (!key || row.fileAsset.storageProvider !== 'R2') {
    throw new MailAttachmentLoadError(`Outbound attachment ${row.id} is missing an R2 storage key`);
  }
  const content = await readOutboundAttachmentBytes(r2, key, row.id);
  const cidToken = `att-${row.id}`;
  const htmlHasCid = Boolean(bodyHtml?.includes(`cid:${cidToken}`) || bodyHtml?.includes(`cid:${row.fileName}`));
  const isInline = row.isInline || htmlHasCid;
  return {
    filename: row.fileName,
    content,
    contentType: row.mimeType ?? row.fileAsset.mimeType ?? 'application/octet-stream',
    contentId: isInline ? cidToken : undefined,
    isInline,
  };
}

/** Loads Drive FileAsset bytes for outbound MIME attachments (worker/system path). */
export async function loadOutboundAttachmentParts(
  prisma: InstanceType<typeof PrismaClient>,
  r2: DriveR2Client,
  messageId: string,
  bodyHtml: string | null,
): Promise<SendMessageAttachment[]> {
  const rows = await prisma.emailAttachment.findMany({
    where: { messageId },
    include: {
      fileAsset: {
        include: {
          versions: { where: { isCurrent: true }, orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      },
    },
  });
  if (rows.length === 0) {
    return [];
  }
  const parts: SendMessageAttachment[] = [];
  for (const row of rows) {
    parts.push(await loadOneOutboundAttachmentPart(r2, row, bodyHtml));
  }
  return parts;
}
