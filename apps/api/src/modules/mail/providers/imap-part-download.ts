import type { ImapFlow } from 'imapflow';
import type { Readable } from 'node:stream';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';
import { DEFAULT_ATTACHMENT_MIME, IMAP_PART_ID_PREFIX } from './imap-message.attachments';
import type { DownloadedAttachment } from './mail-provider-adapter';

function isReadableContent(value: unknown): value is Readable {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value;
}

export async function bufferReadable(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** FETCH a single BODYSTRUCTURE section. Missing part is a permanent failure. */
export async function downloadImapBodyPart(
  client: ImapFlow,
  uid: number,
  section: string,
): Promise<DownloadedAttachment> {
  const result = await client.download(String(uid), section, { uid: true });
  if (!isReadableContent(result.content)) {
    throw new MailAttachmentPermanentError(
      `IMAP attachment part not found: ${IMAP_PART_ID_PREFIX}${section}`,
    );
  }
  return {
    filename: result.meta?.filename || `attachment-${section}`,
    contentType: result.meta?.contentType || DEFAULT_ATTACHMENT_MIME,
    content: await bufferReadable(result.content),
  };
}
