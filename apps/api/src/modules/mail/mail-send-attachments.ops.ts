import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { PrismaClient } from '@nbos/database';
import type { DriveR2Client } from '../drive/drive-r2.client';
import type { SendMessageAttachment } from './providers/mail-provider-adapter';

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
  const parts: SendMessageAttachment[] = [];
  for (const row of rows) {
    const key = row.fileAsset.versions[0]?.storageKey ?? row.fileAsset.storageKey;
    if (!key || row.fileAsset.storageProvider !== 'R2') {
      continue;
    }
    const response = await r2.ensureS3().send(new GetObjectCommand({ Bucket: r2.bucket, Key: key }));
    const content = await bufferFromR2Body(response.Body as AsyncIterable<Uint8Array> | undefined);
    if (!content) {
      continue;
    }
    const cidToken = `att-${row.id}`;
    const htmlHasCid = Boolean(bodyHtml?.includes(`cid:${cidToken}`) || bodyHtml?.includes(`cid:${row.fileName}`));
    const isInline = row.isInline || htmlHasCid;
    parts.push({
      filename: row.fileName,
      content,
      contentType: row.mimeType ?? row.fileAsset.mimeType ?? 'application/octet-stream',
      contentId: isInline ? cidToken : undefined,
      isInline,
    });
  }
  return parts;
}
