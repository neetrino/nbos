/** Max inbound attachment size (canon §19). Larger files stay FAILED and are not stored. */
export const MAIL_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

export const MAIL_ATTACHMENT_STORAGE_CONTEXT = 'mail/attachments';
