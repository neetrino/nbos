/** Trashed credentials older than this are eligible for scheduled hard purge. */
export const CREDENTIAL_TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Max credentials purged per platform trash tick. */
export const CREDENTIAL_TRASH_PURGE_BATCH_CAP = 100;
