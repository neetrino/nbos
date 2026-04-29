/** Audit `entity_type` for mail thread–scoped events. */
export const MAIL_AUDIT_ENTITY_THREAD = 'mail_thread';

/** Audit `entity_type` for a single mail message row. */
export const MAIL_AUDIT_ENTITY_MESSAGE = 'mail_message';

/** User marked NBOS thread read (no provider sync). */
export const MAIL_AUDIT_ACTION_THREAD_MARKED_READ = 'mail.thread_marked_read';

/** Outbound draft persisted locally (no SMTP send). */
export const MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED = 'mail.outbound_draft_created';
