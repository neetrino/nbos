import type { VideoMeetingStatus } from '@/lib/api/video-meetings';

type StatusTranslator = (key: `status.${VideoMeetingStatus}`) => string;

export function videoMeetingStatusLabel(
  status: VideoMeetingStatus,
  translate: StatusTranslator,
): string {
  return translate(`status.${status}`);
}
