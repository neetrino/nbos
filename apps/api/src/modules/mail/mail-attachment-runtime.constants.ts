/** BullMQ jobId for one inbound attachment download (debounce + idempotency). */
export const MAIL_ATTACHMENT_JOB_ID_PREFIX = 'mail-att:';

export function mailAttachmentJobId(attachmentId: string): string {
  return `${MAIL_ATTACHMENT_JOB_ID_PREFIX}${attachmentId}`;
}
