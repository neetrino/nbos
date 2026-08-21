import { describe, expect, it } from 'vitest';
import {
  classifyAtsRecordingHttpStatus,
  isLikelyAudioContentType,
} from './ats-call-recording-http';

describe('ats-call-recording-http', () => {
  it('treats 404 as retryable and 403 as permanent', () => {
    expect(classifyAtsRecordingHttpStatus(404)).toBe('transient');
    expect(classifyAtsRecordingHttpStatus(503)).toBe('transient');
    expect(classifyAtsRecordingHttpStatus(403)).toBe('permanent');
    expect(classifyAtsRecordingHttpStatus(401)).toBe('permanent');
  });

  it('accepts audio and octet-stream bodies', () => {
    expect(isLikelyAudioContentType('audio/wav')).toBe(true);
    expect(isLikelyAudioContentType('application/octet-stream')).toBe(true);
    expect(isLikelyAudioContentType('application/json')).toBe(false);
  });
});
