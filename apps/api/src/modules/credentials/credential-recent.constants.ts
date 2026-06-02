/** Max credentials returned for the recent strip. */
export const CREDENTIAL_RECENT_LIMIT = 10;

/** Audit rows scanned before dedupe (per user, recent window). */
export const CREDENTIAL_RECENT_AUDIT_SCAN_LIMIT = 100;

/** How far back to consider audit activity for "recently used". */
export const CREDENTIAL_RECENT_LOOKBACK_DAYS = 30;

export const CREDENTIAL_RECENT_AUDIT_ACTIONS = [
  'credential.view',
  'credential.secret_copied',
  'credential.url_opened',
] as const;

/** Non-credential entity ids stored under entityType credential. */
export const CREDENTIAL_RECENT_EXCLUDED_ENTITY_IDS = ['bulk_export'] as const;
