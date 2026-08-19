/** Max inbound attachment size (canon §19). Larger files stay FAILED and are not stored. */
export const MAIL_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;

export const MAIL_ATTACHMENT_STORAGE_CONTEXT = 'mail/attachments';

/**
 * PENDING without READY/FAILED after this age is stuck (enqueue-miss or terminal job).
 * Slightly above BullMQ attachment retry budget (~155s).
 */
export const MAIL_ATTACHMENT_PENDING_STUCK_MS = 3 * 60 * 1000;
