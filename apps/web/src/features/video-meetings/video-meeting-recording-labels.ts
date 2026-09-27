import type { VideoMeetingRecordingStatus } from '@/lib/api/video-meetings';

const GROUP_STATUS_KEYS = {
  PENDING: 'groupStatus.PENDING',
  RECORDING: 'groupStatus.RECORDING',
  FINALIZING: 'groupStatus.FINALIZING',
  READY: 'groupStatus.READY',
  PARTIAL: 'groupStatus.PARTIAL',
  FAILED: 'groupStatus.FAILED',
} as const satisfies Record<
  VideoMeetingRecordingStatus,
  | 'groupStatus.PENDING'
  | 'groupStatus.RECORDING'
  | 'groupStatus.FINALIZING'
  | 'groupStatus.READY'
  | 'groupStatus.PARTIAL'
  | 'groupStatus.FAILED'
>;

export function recordingGroupStatusKey(
  status: VideoMeetingRecordingStatus,
): (typeof GROUP_STATUS_KEYS)[VideoMeetingRecordingStatus] {
  return GROUP_STATUS_KEYS[status];
}
