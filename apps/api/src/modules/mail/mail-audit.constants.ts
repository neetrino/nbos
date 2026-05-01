/** Audit `entity_type` for mail thread–scoped events. */
export const MAIL_AUDIT_ENTITY_THREAD = 'mail_thread';

/** Audit `entity_type` for a single mail message row. */
export const MAIL_AUDIT_ENTITY_MESSAGE = 'mail_message';

/** Audit `entity_type` for a connected mailbox row. */
export const MAIL_AUDIT_ENTITY_MAIL_ACCOUNT = 'mail_account';

/** User marked NBOS thread read (no provider sync). */
export const MAIL_AUDIT_ACTION_THREAD_MARKED_READ = 'mail.thread_marked_read';

/** Thread `needsBusinessLink` flag changed (MVP; no polymorphic link payload yet). */
export const MAIL_AUDIT_ACTION_THREAD_NEEDS_LINK_UPDATED = 'mail.thread_needs_link_updated';

/** Outbound draft persisted locally (no SMTP send). */
export const MAIL_AUDIT_ACTION_OUTBOUND_DRAFT_CREATED = 'mail.outbound_draft_created';

/** Outbound draft moved to queued (no worker/SMTP in this MVP). */
export const MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_QUEUED = 'mail.outbound_message_queued';

/** Stub finalize: QUEUED → FAILED because no mail provider / worker (MVP). */
export const MAIL_AUDIT_ACTION_OUTBOUND_SEND_STUB_FAILED = 'mail.outbound_send_stub_failed';

/** Outbound draft or queued send cancelled locally (no provider interaction). */
export const MAIL_AUDIT_ACTION_OUTBOUND_MESSAGE_CANCELLED = 'mail.outbound_message_cancelled';

/** Outbound FAILED reset to DRAFT for local retry (no provider). */
export const MAIL_AUDIT_ACTION_OUTBOUND_FAILED_RESET_TO_DRAFT =
  'mail.outbound_failed_reset_to_draft';

/** Manual sync stub: timestamps only (no provider fetch). */
export const MAIL_AUDIT_ACTION_MAIL_ACCOUNT_SYNC_STUB = 'mail.mail_account_sync_stub';
