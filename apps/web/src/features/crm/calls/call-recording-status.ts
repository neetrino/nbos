import type { CallRecordingStatus } from '@/lib/api/calls';

export function callRecordingLabel(status: CallRecordingStatus | null): string {
  if (status == null) return 'No recording available';
  if (status === 'FAILED') return 'Recording unavailable';
  if (status === 'READY') return 'Ready';
  return 'Downloading...';
}

export function canPlayCallRecording(status: CallRecordingStatus | null): boolean {
  return status === 'READY';
}
