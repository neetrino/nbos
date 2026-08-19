const MAIL_SENDABLE_STATUSES = new Set(['ACTIVE', 'DEGRADED', 'SYNCING']);

export function isMailAccountSendable(status: string): boolean {
  return MAIL_SENDABLE_STATUSES.has(status);
}
