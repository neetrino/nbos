import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { VideoMeetingStatus } from '@/lib/api/video-meetings';

type StatusTranslator = (key: `status.${VideoMeetingStatus}`) => string;

const STATUS_BADGE_VARIANT: Record<VideoMeetingStatus, StatusVariant> = {
  CREATED: 'blue',
  WAITING: 'amber',
  ACTIVE: 'green',
  IDLE: 'gray',
  ENDED: 'zinc',
  CANCELLED: 'red',
};

export function videoMeetingStatusLabel(
  status: VideoMeetingStatus,
  translate: StatusTranslator,
): string {
  return translate(`status.${status}`);
}

export function videoMeetingStatusVariant(status: VideoMeetingStatus): StatusVariant {
  return STATUS_BADGE_VARIANT[status];
}
