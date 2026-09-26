/** Default title for an instant standalone meeting (no Calendar / entity). */
export const VIDEO_MEETING_DEFAULT_TITLE = 'Instant meeting' as const;

/** Opaque LiveKit room-name placeholder prefix (S02 — no LiveKit network call). */
export const VIDEO_MEETING_ROOM_NAME_PREFIX = 'vm_' as const;

/** Bytes of randomness in the opaque room-name suffix. */
export const VIDEO_MEETING_ROOM_NAME_RANDOM_BYTES = 16 as const;

/** Max page size for list / history. */
export const VIDEO_MEETING_LIST_MAX_PAGE_SIZE = 100 as const;

/** Default page size for list / history. */
export const VIDEO_MEETING_LIST_DEFAULT_PAGE_SIZE = 20 as const;

/**
 * DI token: tests may inject `true` to enable the module without env.
 * Production / default app wiring must omit this token (flag stays OFF).
 */
export const VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN = 'VIDEO_MEETINGS_FEATURE_ENABLED_OVERRIDE';

/** Env key read by the feature gate (empty / unset → default OFF). */
export const VIDEO_MEETINGS_FEATURE_ENV_KEY = 'VIDEO_MEETINGS_V1_ENABLED' as const;
