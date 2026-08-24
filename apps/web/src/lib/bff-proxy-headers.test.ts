import { describe, expect, it } from 'vitest';
import { shouldStripDecodedContentLength } from '@/lib/bff-content-length';

describe('shouldStripDecodedContentLength', () => {
  it('keeps Content-Length for uncompressed audio and JSON', () => {
    expect(shouldStripDecodedContentLength(null)).toBe(false);
    expect(shouldStripDecodedContentLength('identity')).toBe(false);
    expect(shouldStripDecodedContentLength('')).toBe(false);
  });

  it('strips Content-Length when fetch has decoded gzip or br', () => {
    expect(shouldStripDecodedContentLength('gzip')).toBe(true);
    expect(shouldStripDecodedContentLength('br')).toBe(true);
  });
});
