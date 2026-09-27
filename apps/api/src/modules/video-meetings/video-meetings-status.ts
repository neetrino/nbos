import { VideoMeetingStatus } from '@nbos/database';

/** Legacy `ENDED` rows are read as `IDLE`; application writes use `IDLE` only. */
export function isVideoMeetingIdle(status: VideoMeetingStatus): boolean {
  return status === VideoMeetingStatus.IDLE || status === VideoMeetingStatus.ENDED;
}

/** A room can open a new session unless one is open or it was cancelled. */
export function canStartVideoMeeting(status: VideoMeetingStatus): boolean {
  return status !== VideoMeetingStatus.ACTIVE && status !== VideoMeetingStatus.CANCELLED;
}

/** Status values matched by an idle filter (IDLE plus legacy ENDED). */
export const VIDEO_MEETING_IDLE_STATUSES: readonly VideoMeetingStatus[] = [
  VideoMeetingStatus.IDLE,
  VideoMeetingStatus.ENDED,
];
