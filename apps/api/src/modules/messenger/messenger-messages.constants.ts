/** Default window size for channel/DM history (most recent chunk first). */
export const MESSENGER_MESSAGES_DEFAULT_PAGE_SIZE = 100;

/** Hard cap per request to protect DB and payloads at scale. */
export const MESSENGER_MESSAGES_MAX_PAGE_SIZE = 100;

/** Merged channel+DM search cap (each branch uses this take). */
export const MESSENGER_SEARCH_PAGE_SIZE = 25;

export const MESSENGER_SEARCH_MIN_QUERY_LEN = 2;
