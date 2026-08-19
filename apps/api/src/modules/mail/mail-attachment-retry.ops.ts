import type { PrismaClient } from '@nbos/database';

export function isAttachmentDownloadRetryable(downloadStatus: string): boolean {
  return downloadStatus === 'FAILED' || downloadStatus === 'PENDING';
}

/**
 * Moves a FAILED inbound attachment back to PENDING for another download.
 * @returns whether a row was updated
 */
export async function queueFailedAttachmentForRetry(
  prisma: InstanceType<typeof PrismaClient>,
  params: { messageId: string; attachmentId: string },
): Promise<boolean> {
  const result = await prisma.emailAttachment.updateMany({
    where: {
      id: params.attachmentId,
      messageId: params.messageId,
      downloadStatus: 'FAILED',
    },
    data: { downloadStatus: 'PENDING' },
  });
  return result.count > 0;
}
