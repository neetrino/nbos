import type { TransactionClient } from '@nbos/database';
import { MAIL_ATTACHMENT_MAX_BYTES } from './mail-attachment.constants';
import type { NormalizedAttachment } from './providers/mail-provider-adapter';

export type MailPendingAttachmentDownload = {
  messageId: string;
  attachmentId: string;
};

export function isMailAttachmentOversize(sizeBytes: number | null | undefined): boolean {
  return sizeBytes != null && sizeBytes > MAIL_ATTACHMENT_MAX_BYTES;
}

export async function persistInboundAttachments(
  tx: TransactionClient,
  messageId: string,
  attachments: NormalizedAttachment[] | undefined,
): Promise<MailPendingAttachmentDownload[]> {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  const pending: MailPendingAttachmentDownload[] = [];
  for (const attachment of attachments) {
    const oversize = isMailAttachmentOversize(attachment.sizeBytes);
    const created = await tx.emailAttachment.create({
      data: {
        messageId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes == null ? null : BigInt(attachment.sizeBytes),
        providerAttachmentId: attachment.providerAttachmentId,
        isInline: attachment.isInline,
        downloadStatus: oversize ? 'FAILED' : 'PENDING',
      },
    });
    if (!oversize) {
      pending.push({ messageId, attachmentId: created.id });
    }
  }
  return pending;
}
