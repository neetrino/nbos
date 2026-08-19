/** Shown after compose/reply/queue when the send job was accepted. */
export const MAIL_QUEUED_TOAST = 'Email queued.';

/** Shown after FAILED → QUEUED retry. */
export const MAIL_RETRY_QUEUED_TOAST = 'Retry queued.';

/** Shown after FAILED → PENDING or stuck PENDING re-enqueue. */
export const MAIL_ATTACHMENT_RETRY_TOAST = 'Attachment download queued.';

/** Ambiguous provider outcome — do not assume the message was sent. */
export const MAIL_OUTCOME_UNKNOWN_COPY =
  'Could not confirm delivery. Check Sent in the mailbox provider before sending again.';
