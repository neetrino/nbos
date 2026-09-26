/** Default title for an instant standalone meeting (no Calendar / entity). */
export const VIDEO_MEETING_DEFAULT_TITLE = 'Instant meeting' as const;

/** Opaque LiveKit room-name placeholder prefix. */
export const VIDEO_MEETING_ROOM_NAME_PREFIX = 'vm_' as const;

/** Bytes of randomness in the opaque room-name suffix. */
export const VIDEO_MEETING_ROOM_NAME_RANDOM_BYTES = 16 as const;

/** Max page size for list / history. */
export const VIDEO_MEETING_LIST_MAX_PAGE_SIZE = 100 as const;

/** Default page size for list / history. */
export const VIDEO_MEETING_LIST_DEFAULT_PAGE_SIZE = 20 as const;

/** LiveKit AccessToken TTL for join JWTs (seconds). */
export const VIDEO_MEETING_LIVEKIT_TOKEN_TTL_SECONDS = 3600 as const;

/** Empty-room timeout passed to LiveKit CreateRoom (seconds). */
export const VIDEO_MEETING_LIVEKIT_EMPTY_TIMEOUT_SECONDS = 600 as const;

/**
 * DI token: tests may inject `true` to enable the module without env.
 * Production / default app wiring must omit this token (flag stays OFF).
 */
export const VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN = 'VIDEO_MEETINGS_FEATURE_ENABLED_OVERRIDE';

/** Env key read by the feature gate (empty / unset → default OFF). */
export const VIDEO_MEETINGS_FEATURE_ENV_KEY = 'VIDEO_MEETINGS_V1_ENABLED' as const;

/** LiveKit HTTP/WS URL for RoomServiceClient (e.g. http://127.0.0.1:7880). */
export const LIVEKIT_URL_ENV_KEY = 'LIVEKIT_URL' as const;

/** Public WS URL returned to browsers (may differ from server URL behind a proxy). */
export const LIVEKIT_PUBLIC_URL_ENV_KEY = 'LIVEKIT_PUBLIC_URL' as const;

export const LIVEKIT_API_KEY_ENV_KEY = 'LIVEKIT_API_KEY' as const;
export const LIVEKIT_API_SECRET_ENV_KEY = 'LIVEKIT_API_SECRET' as const;

/** Default CalendarMeeting window when createCalendarMeeting is requested without times. */
export const VIDEO_MEETING_CALENDAR_DEFAULT_DURATION_MS = 3_600_000;
