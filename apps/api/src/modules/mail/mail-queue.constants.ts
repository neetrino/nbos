/** BullMQ queue + job names for Mail background work (sync + outbound send). */
export const MAIL_QUEUE_NAME = 'mail';
export const MAIL_SYNC_JOB_NAME = 'mail.sync';
export const MAIL_SEND_JOB_NAME = 'mail.send';

export interface MailSyncJobPayload {
  kind: 'sync';
  mailAccountId: string;
}

export interface MailSendJobPayload {
  kind: 'send';
  mailAccountId: string;
  messageId: string;
  actorEmployeeId: string;
}

export type MailQueueJobPayload = MailSyncJobPayload | MailSendJobPayload;
