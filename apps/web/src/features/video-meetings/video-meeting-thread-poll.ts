import type { VideoMeetingRecordingStatus } from '@/lib/api/video-meetings';
import type { VideoMeetingThreadItem } from '@/lib/api/video-meetings-thread';

const NON_TERMINAL_RECORDING = new Set<VideoMeetingRecordingStatus>([
  'PENDING',
  'RECORDING',
  'FINALIZING',
]);

export function threadHasNonTerminalRecording(items: VideoMeetingThreadItem[]): boolean {
  return items.some((item) => item.type === 'recording' && NON_TERMINAL_RECORDING.has(item.status));
}
