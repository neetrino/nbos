/**
 * Feature flags for NotificationInboxState rollout.
 * Defaults keep legacy COUNT(*) as the read path until READ is enabled after reconcile.
 */
export function isNotificationInboxStateWriteEnabled(): boolean {
  return parseFlag(process.env.NOTIFICATION_INBOX_STATE_WRITE_ENABLED);
}

export function isNotificationInboxStateReadEnabled(): boolean {
  return parseFlag(process.env.NOTIFICATION_INBOX_STATE_READ_ENABLED);
}

export function isNotificationInboxStateReconcileEnabled(): boolean {
  return parseFlag(process.env.NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED);
}

function parseFlag(raw: string | undefined): boolean {
  const value = raw?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}
