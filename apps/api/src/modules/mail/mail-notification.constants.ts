/** In-app notification `type` for mail stub sync. */
export const MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB = 'mail.account_sync_stub' as const;

export const MAIL_NOTIFICATION_TITLE_ACCOUNT_SYNC_STUB =
  'Mail: sync timestamp recorded (stub)' as const;

/** In-app notification `type` when stub finalize marks outbound QUEUED → FAILED. */
export const MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED =
  'mail.outbound_send_stub_failed' as const;

export const MAIL_NOTIFICATION_TITLE_OUTBOUND_SEND_STUB_FAILED =
  'Mail: outbound send failed (stub)' as const;
