/**
 * Video Meetings V1 feature flag.
 *
 * Settings → Feature Flags UI is still a placeholder (not DB-backed).
 * Gate Nest module load and UI surfaces on this named constant until a
 * platform flag store exists. Default OFF — do not enable for production
 * until the S07 gate and an explicit owner enable.
 */

/** Stable flag key for future DB-backed / Settings wiring. */
export const VIDEO_MEETINGS_FEATURE_FLAG_KEY = 'video_meetings_v1' as const;

/** Default availability: off until explicitly enabled. */
export const VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT = false as const;

/**
 * Resolves whether Video Meetings V1 is enabled.
 * Pass an explicit override (e.g. from Nest config); omit / empty → default OFF.
 */
export function isVideoMeetingsFeatureEnabled(envValue?: string | null): boolean {
  if (envValue == null || envValue.trim() === '') {
    return VIDEO_MEETINGS_FEATURE_ENABLED_DEFAULT;
  }
  const normalized = envValue.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on';
}
