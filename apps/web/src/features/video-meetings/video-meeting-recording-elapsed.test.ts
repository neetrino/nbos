import { describe, expect, it } from 'vitest';
import { formatRecordingElapsed, recordingElapsedSeconds } from './video-meeting-recording-elapsed';

describe('formatRecordingElapsed', () => {
  it('prints minutes and seconds', () => {
    expect(formatRecordingElapsed(0)).toBe('00:00');
    expect(formatRecordingElapsed(65)).toBe('01:05');
  });

  it('prints hours once the recording passes an hour', () => {
    expect(formatRecordingElapsed(3661)).toBe('1:01:01');
  });
});

describe('recordingElapsedSeconds', () => {
  it('counts whole seconds from the start instant', () => {
    expect(
      recordingElapsedSeconds('2026-09-27T13:00:00.000Z', Date.parse('2026-09-27T13:00:12.900Z')),
    ).toBe(12);
  });

  it('returns null for an unreadable start', () => {
    expect(recordingElapsedSeconds('not-a-date', Date.now())).toBeNull();
  });
});
