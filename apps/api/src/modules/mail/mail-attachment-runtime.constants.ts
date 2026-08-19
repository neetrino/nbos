import { toBullMqSafeJobId } from '@nbos/shared';

/** Logical BullMQ jobId prefix for one inbound attachment download. */
export const MAIL_ATTACHMENT_JOB_ID_PREFIX = 'mail-att:';

export function mailAttachmentJobId(attachmentId: string): string {
  return toBullMqSafeJobId(`${MAIL_ATTACHMENT_JOB_ID_PREFIX}${attachmentId}`);
}
