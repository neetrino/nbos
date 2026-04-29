/** In-app notification `type` for mail stub sync. */
export const MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB = 'mail.account_sync_stub' as const;

export const MAIL_NOTIFICATION_TITLE_ACCOUNT_SYNC_STUB =
  'Mail: sync timestamp recorded (stub)' as const;

/** In-app notification `type` when stub finalize marks outbound QUEUED → FAILED. */
export const MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED =
  'mail.outbound_send_stub_failed' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_SEND_STUB_FAILED =
  'Mail: outbound send failed (stub)' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED =
  'mail.outbound_message_cancelled' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_MESSAGE_CANCELLED =
  'Mail: outbound send cancelled' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT =
  'mail.outbound_failed_reset_to_draft' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_FAILED_RESET_TO_DRAFT =
  'Mail: failed send reset to draft' as const;

/** In-app notification when outbound DRAFT → QUEUED (stub pipeline). */
export const MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP =
  'mail.outbound_message_queued' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_MESSAGE_QUEUED_IN_APP =
  'Mail: outbound queued for send (stub)' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_DRAFT_CREATED_IN_APP =
  'mail.outbound_draft_created' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_DRAFT_CREATED_IN_APP =
  'Mail: outbound draft saved' as const;
