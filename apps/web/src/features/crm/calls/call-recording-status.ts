import type { CallRecordingStatus } from '@/lib/api/calls';

export function callRecordingLabelKey(status: CallRecordingStatus | null): string {
  if (status == null) return 'calls.noRecording';
  if (status === 'FAILED') return 'calls.recordingUnavailable';
  if (status === 'READY') return 'calls.recordingReady';
  return 'calls.recordingDownloading';
}

export function canPlayCallRecording(status: CallRecordingStatus | null): boolean {
  return status === 'READY';
}
