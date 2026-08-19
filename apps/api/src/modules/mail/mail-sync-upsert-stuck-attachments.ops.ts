import type { TransactionClient } from '@nbos/database';
import { MAIL_ATTACHMENT_PENDING_STUCK_MS } from './mail-attachment.constants';
import type { MailPendingAttachmentDownload } from './mail-sync-upsert-attachments.ops';

/**
 * Unique inbound skip does not recreate rows. Re-queue leftover PENDING
 * (enqueue-miss / completed job without READY) after the stuck timeout.
 */
export async function listStuckPendingAttachmentDownloads(
  tx: TransactionClient,
  messageId: string,
  now: Date = new Date(),
): Promise<MailPendingAttachmentDownload[]> {
  const cutoff = new Date(now.getTime() - MAIL_ATTACHMENT_PENDING_STUCK_MS);
  const rows = await tx.emailAttachment.findMany({
    where: {
      messageId,
      downloadStatus: 'PENDING',
      fileAssetId: null,
      createdAt: { lte: cutoff },
    },
    select: { id: true },
  });
  return rows.map((row) => ({ messageId, attachmentId: row.id }));
}
