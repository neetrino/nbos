export const MESSENGER_PERSISTENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const MESSENGER_CACHE_SCHEMA_VERSION = 2;
export const MESSENGER_PERSIST_DB_NAME = 'nbos-messenger-cache';
export const MESSENGER_PERSIST_STORE_NAME = 'records';
export const MESSENGER_PERSIST_DB_VERSION = 1;
export const MESSENGER_PERSIST_CHANNEL_NAME = 'nbos-messenger-persist';
export const MESSENGER_PERSIST_IDENTITY_MAX_LENGTH = 128;
export const MESSENGER_PERSIST_IDENTITY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
export const MESSENGER_PERSIST_ENTITY_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/** One Internal/Client list page (`MESSENGER_CORE_*_LIST_PAGE_SIZE` = 100). */
export const MESSENGER_PERSIST_ROWS_PER_QUERY_MAX = 100;
/** Collection list has no API page size; same 100-row list-page contract. */
export const MESSENGER_PERSIST_COLLECTION_LIST_MAX = MESSENGER_PERSIST_ROWS_PER_QUERY_MAX;
/**
 * Canonical persist families only: Internal all-dataset, Client default inbox,
 * INTERNAL collections, CLIENT collections. Search/filter/provider variants are
 * not persisted. Not a retention TTL.
 */
export const MESSENGER_PERSIST_QUERY_COUNT_MAX = 4;
/** Two API list pages of max-preview rows. Not a retention TTL. */
export const MESSENGER_PERSIST_ENVELOPE_MAX_BYTES =
  2 * MESSENGER_PERSIST_ROWS_PER_QUERY_MAX * 8192;
export const MESSENGER_PERSIST_PREVIEW_MAX_CHARS = 8192;
export const MESSENGER_PERSIST_TITLE_MAX_CHARS = 256;
export const MESSENGER_PERSIST_SEARCH_Q_MAX_CHARS = 200;
export const MESSENGER_PERSIST_STATUS_MAX_CHARS = 32;
export const MESSENGER_PERSIST_ISO_DATE_MAX_CHARS = 40;
export const MESSENGER_PERSIST_CURSOR_MAX_CHARS = 512;
export const MESSENGER_PERSIST_ATTENTION_PER_ROW_MAX = 32;

let enabledOverride: boolean | null = null;

export function isMessengerPersistenceEnabled(): boolean {
  if (enabledOverride !== null) return enabledOverride;
  const flag = process.env.NEXT_PUBLIC_MESSENGER_PERSISTENCE;
  return flag !== '0' && flag !== 'false';
}

export function setMessengerPersistenceEnabledForTests(enabled: boolean | null): void {
  enabledOverride = enabled;
}

export function resetMessengerPersistEnabledForTests(): void {
  enabledOverride = null;
}
