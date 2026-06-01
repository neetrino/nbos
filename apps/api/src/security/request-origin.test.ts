import { describe, it, expect } from 'vitest';
import { isMutatingHttpMethod, originFromReferer, resolveRequestOrigin } from './request-origin';

describe('request-origin', () => {
  it('parses origin from referer', () => {
    expect(originFromReferer('https://app.example.com/sign-in')).toBe('https://app.example.com');
  });

  it('returns null for invalid referer', () => {
    expect(originFromReferer('not-a-url')).toBeNull();
  });

  it('prefers Origin header over Referer', () => {
    expect(resolveRequestOrigin('https://a.test', 'https://b.test/page')).toBe('https://a.test');
  });

  it('detects mutating methods', () => {
    expect(isMutatingHttpMethod('POST')).toBe(true);
    expect(isMutatingHttpMethod('get')).toBe(false);
    expect(isMutatingHttpMethod('OPTIONS')).toBe(false);
  });
});
