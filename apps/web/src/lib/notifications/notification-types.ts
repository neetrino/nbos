/** Mirrors API `mail-notification.constants` for client-side icon routing. */
export const MAIL_NOTIFICATION_TYPE_ACCOUNT_SYNC_STUB = 'mail.account_sync_stub' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_SEND_STUB_FAILED =
  'mail.outbound_send_stub_failed' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_CANCELLED =
  'mail.outbound_message_cancelled' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_FAILED_RESET_TO_DRAFT =
  'mail.outbound_failed_reset_to_draft' as const;

export const MAIL_NOTIFICATION_TYPE_OUTBOUND_MESSAGE_QUEUED_IN_APP =
  'mail.outbound_message_queued' as const;
