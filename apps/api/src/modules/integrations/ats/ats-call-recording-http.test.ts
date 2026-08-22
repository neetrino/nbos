import { describe, expect, it } from 'vitest';
import {
  classifyAtsRecordingHttpStatus,
  isAtsRecordingRedirectStatus,
  isLikelyAudioContentType,
  parseAtsRecordingContentLength,
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

  it('treats 301-308 as redirects and parses content-length', () => {
    expect(isAtsRecordingRedirectStatus(302)).toBe(true);
    expect(isAtsRecordingRedirectStatus(308)).toBe(true);
    expect(isAtsRecordingRedirectStatus(200)).toBe(false);
    expect(parseAtsRecordingContentLength('12')).toBe(12);
    expect(parseAtsRecordingContentLength(null)).toBeNull();
  });
});
