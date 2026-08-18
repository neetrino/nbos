import type { Attachment, ParsedMail } from 'mailparser';
import type { DownloadedAttachment, NormalizedAttachment } from './mail-provider-adapter';
import { MailAttachmentPermanentError } from '../mail-provider-error.classify';

function stripCidBrackets(value: string): string {
  return value.replace(/^<|>$/g, '').trim();
}

/** Stable IMAP part id: content-id / cid, else `part:{index}:{filename}`. */
export function imapProviderAttachmentId(
  attachment: Pick<Attachment, 'contentId' | 'cid' | 'filename'>,
  index: number,
): string {
  const cid = stripCidBrackets(attachment.contentId || attachment.cid || '');
  if (cid) {
    return cid;
  }
  return `part:${index}:${attachment.filename ?? 'unnamed'}`;
}

function toNormalizedAttachment(attachment: Attachment, index: number): NormalizedAttachment {
  return {
    providerAttachmentId: imapProviderAttachmentId(attachment, index),
    fileName: attachment.filename || `attachment-${index + 1}`,
    mimeType: attachment.contentType || null,
    sizeBytes: typeof attachment.size === 'number' ? attachment.size : null,
    isInline: attachment.contentDisposition === 'inline' || Boolean(attachment.related),
  };
}

/** Metadata only — does not copy `content` buffers into the normalized message. */
export function collectImapAttachments(parsed: ParsedMail): NormalizedAttachment[] {
  return (parsed.attachments ?? []).map((attachment, index) =>
    toNormalizedAttachment(attachment, index),
  );
}

function attachmentContent(attachment: Attachment): Buffer {
  const raw = attachment.content;
  return Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
}

export function extractImapAttachment(
  parsed: ParsedMail,
  providerAttachmentId: string,
): DownloadedAttachment {
  const attachments = parsed.attachments ?? [];
  for (let index = 0; index < attachments.length; index += 1) {
    const attachment = attachments[index];
    if (!attachment || imapProviderAttachmentId(attachment, index) !== providerAttachmentId) {
      continue;
    }
    return {
      filename: attachment.filename || `attachment-${index + 1}`,
      contentType: attachment.contentType || 'application/octet-stream',
      content: attachmentContent(attachment),
    };
  }
  throw new MailAttachmentPermanentError(`IMAP attachment part not found: ${providerAttachmentId}`);
}
