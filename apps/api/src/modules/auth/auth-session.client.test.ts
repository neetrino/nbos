import { describe, expect, it } from 'vitest';
import {
  deviceLabelFromUserAgent,
  resolveIssuedClientKind,
  shouldExposeRefreshInJson,
} from './auth-session.client';

describe('auth-session.client', () => {
  it('forces web when Origin is a CORS browser origin', () => {
    const prev = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://app.example.com';
    expect(
      resolveIssuedClientKind({
        requested: 'mobile_work',
        origin: 'https://app.example.com',
      }),
    ).toBe('web');
    process.env.CORS_ORIGIN = prev;
  });

  it('accepts native kind without Origin', () => {
    expect(resolveIssuedClientKind({ requested: 'mobile_vault' })).toBe('mobile_vault');
  });

  it('exposes refresh only for native non-browser requests', () => {
    const prev = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://app.example.com';
    expect(shouldExposeRefreshInJson({ clientKind: 'mobile_work' })).toBe(true);
    expect(shouldExposeRefreshInJson({ clientKind: 'web' })).toBe(false);
    expect(
      shouldExposeRefreshInJson({
        clientKind: 'mobile_work',
        bffHeader: '1',
      }),
    ).toBe(false);
    expect(
      shouldExposeRefreshInJson({
        clientKind: 'mobile_work',
        origin: 'https://app.example.com',
      }),
    ).toBe(false);
    process.env.CORS_ORIGIN = prev;
  });

  it('builds a short device label from User-Agent', () => {
    expect(
      deviceLabelFromUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
      ),
    ).toBe('Chrome · macOS');
  });
});
