/** Default guest invite lifetime when creating from the detail screen. */
export const VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS = 24;

/** Poll interval for host waiting-room list while in the room. */
export const VIDEO_MEETING_WAITING_POLL_MS = 4000;

/** Poll interval while the room thread has a non-terminal recording card. */
export const VIDEO_MEETING_THREAD_POLL_MS = 5000;

/** Poll interval for pending colleague invite prompts in the app shell. */
export const VIDEO_MEETING_COLLEAGUE_INVITE_POLL_MS = 12_000;

/** Legacy English default title still present on older meeting rows. */
export const VIDEO_MEETING_LEGACY_DEFAULT_TITLE = 'Instant meeting';

/** Current API default title for instant meetings. */
export const VIDEO_MEETING_STORED_DEFAULT_TITLE = 'Мгновенная встреча';

/** Marker attribute for tests: guest shell must not mount app sidebar. */
export const VIDEO_MEETING_GUEST_SHELL_MARKER = 'data-video-meeting-guest-shell';
