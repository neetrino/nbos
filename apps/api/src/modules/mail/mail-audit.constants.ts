/** Audit `entity_type` for mail thread–scoped events. */
export const MAIL_AUDIT_ENTITY_THREAD = 'mail_thread';

/** Audit `entity_type` for a single mail message row. */
export const MAIL_AUDIT_ENTITY_MESSAGE = 'mail_message';

/** User marked NBOS thread read (no provider sync). */
export const MAIL_AUDIT_ACTION_THREAD_MARKED_READ = 'mail.thread_marked_read';

/** Outbound draft persisted locally (no SMTP send). */
export const MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED = 'mail.outbound_draft_created';

/** Outbound draft moved to queued (no worker/SMTP in this MVP). */
export const MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED = 'mail.outbound_message_queued';

/** Stub finalize: QUEUED → FAILED because no mail provider / worker (MVP). */
export const MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED = 'mail.outbound_send_stub_failed';

/** Outbound draft or queued send cancelled locally (no provider interaction). */
export const MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED = 'mail.outbound_message_cancelled';
