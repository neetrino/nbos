/** BullMQ queue + job names for Mail background work (sync + send + attachments). */
export const MAIL_QUEUE_NAME = 'mail';
export const MAIL_SYNC_JOB_NAME = 'mail.sync';
export const MAIL_SEND_JOB_NAME = 'mail.send';
export const MAIL_ATTACHMENT_DOWNLOAD_JOB_NAME = 'mail.attachment.download';

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

export interface MailAttachmentDownloadJobPayload {
  kind: 'attachment';
  messageId: string;
  attachmentId: string;
}

export type MailQueueJobPayload =
  | MailSyncJobPayload
  | MailSendJobPayload
  | MailAttachmentDownloadJobPayload;
