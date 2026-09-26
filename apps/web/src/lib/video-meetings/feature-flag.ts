import { isVideoMeetingsFeatureEnabled } from '@nbos/shared';

/** Public env mirror of API `VIDEO_MEETINGS_V1_ENABLED`; default OFF when unset. */
export const VIDEO_MEETINGS_WEB_PUBLIC_ENV_KEY = 'NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED' as const;

/** Resolves whether Video Meetings UI routes and nav are enabled. */
export function isVideoMeetingsWebFeatureEnabled(): boolean {
  return isVideoMeetingsFeatureEnabled(process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED);
}
