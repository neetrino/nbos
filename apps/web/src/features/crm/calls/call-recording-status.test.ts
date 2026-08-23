import { describe, expect, it } from 'vitest';
import { callRecordingLabel, canPlayCallRecording } from './call-recording-status';

describe('call recording status', () => {
  it('explains missing, in-flight, ready, and failed recordings', () => {
    expect(callRecordingLabel(null)).toBe('No recording available');
    expect(callRecordingLabel('PENDING')).toBe('Downloading...');
    expect(callRecordingLabel('DOWNLOADING')).toBe('Downloading...');
    expect(callRecordingLabel('READY')).toBe('Ready');
    expect(callRecordingLabel('FAILED')).toBe('Recording unavailable');
  });

  it('only enables playback when the file is READY', () => {
    expect(canPlayCallRecording('READY')).toBe(true);
    expect(canPlayCallRecording('PENDING')).toBe(false);
    expect(canPlayCallRecording(null)).toBe(false);
  });
});
