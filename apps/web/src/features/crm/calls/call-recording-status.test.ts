import { describe, expect, it } from 'vitest';
import { callRecordingLabelKey, canPlayCallRecording } from './call-recording-status';

describe('call recording status', () => {
  it('explains missing, in-flight, ready, and failed recordings', () => {
    expect(callRecordingLabelKey(null)).toBe('calls.noRecording');
    expect(callRecordingLabelKey('PENDING')).toBe('calls.recordingDownloading');
    expect(callRecordingLabelKey('DOWNLOADING')).toBe('calls.recordingDownloading');
    expect(callRecordingLabelKey('READY')).toBe('calls.recordingReady');
    expect(callRecordingLabelKey('FAILED')).toBe('calls.recordingUnavailable');
  });

  it('only enables playback when the file is READY', () => {
    expect(canPlayCallRecording('READY')).toBe(true);
    expect(canPlayCallRecording('PENDING')).toBe(false);
    expect(canPlayCallRecording(null)).toBe(false);
  });
});
