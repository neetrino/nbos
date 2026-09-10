export const MESSENGER_QUERY_STALE_TIME_MS = 5 * 60 * 1000;
export const MESSENGER_QUERY_GC_TIME_MS = 60 * 60 * 1000;

/**
 * Per-zone cap for in-session read watermarks on one QueryClient.
 * A live inbox walk can touch many threads; 256 covers that without unbounded growth.
 * Oldest conversation entry is evicted first.
 */
export const MESSENGER_READ_WATERMARK_MAX_PER_ZONE = 256;
