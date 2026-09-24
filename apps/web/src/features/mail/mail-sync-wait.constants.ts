/** Poll health until worker finishes the queued provider sync. */
export const MAIL_PROVIDER_SYNC_POLL_MS = 1000;

/** Give IMAP/Gmail worker time without hanging the inbox toolbar. */
export const MAIL_PROVIDER_SYNC_TIMEOUT_MS = 45_000;

export const MAIL_PROVIDER_SYNCABLE_STATUSES = ['ACTIVE', 'DEGRADED', 'SYNCING'] as const;

export type MailProviderSyncableStatus = (typeof MAIL_PROVIDER_SYNCABLE_STATUSES)[number];
