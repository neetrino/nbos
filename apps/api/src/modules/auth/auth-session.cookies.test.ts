import { afterEach, describe, expect, it } from 'vitest';
import {
  AUTH_REFRESH_COOKIE_PATH,
  buildClearRefreshCookieOptions,
  buildRefreshCookieOptions,
  parseNamedCookieFromSetCookieHeaders,
  serializeRefreshCookie,
} from './auth-session.cookies';

const ENV_KEYS = [
  'AUTH_REFRESH_COOKIE_NAME',
  'AUTH_COOKIE_SECURE',
  'AUTH_COOKIE_SAME_SITE',
  'AUTH_REFRESH_TOKEN_TTL_DAYS',
  'AUTH_COOKIE_DOMAIN',
  'NODE_ENV',
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    const previous = saved[key];
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
});

function snapshotEnv(): void {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
}

describe('auth-session.cookies', () => {
  it('serializes HttpOnly path-scoped refresh cookie', () => {
    snapshotEnv();
    process.env.AUTH_REFRESH_COOKIE_NAME = 'nbos_refresh';
    process.env.AUTH_COOKIE_SECURE = 'true';
    process.env.AUTH_COOKIE_SAME_SITE = 'lax';
    process.env.AUTH_REFRESH_TOKEN_TTL_DAYS = '30';

    const cookie = buildRefreshCookieOptions('sid.raw-secret');
    const header = serializeRefreshCookie(cookie);

    expect(cookie.httpOnly).toBe(true);
    expect(cookie.path).toBe(AUTH_REFRESH_COOKIE_PATH);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe('lax');
    expect(header).toContain('nbos_refresh=sid.raw-secret');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain(`Path=${AUTH_REFRESH_COOKIE_PATH}`);
    expect(header).toMatch(/Max-Age=\d+/);
  });

  it('uses Secure in production by default', () => {
    snapshotEnv();
    delete process.env.AUTH_COOKIE_SECURE;
    process.env.NODE_ENV = 'production';
    process.env.AUTH_REFRESH_COOKIE_NAME = 'nbos_refresh';

    const cookie = buildRefreshCookieOptions('sid.secret');
    expect(cookie.secure).toBe(true);
    expect(serializeRefreshCookie(cookie)).toContain('Secure');
  });

  it('clears cookie with Max-Age=0', () => {
    snapshotEnv();
    process.env.AUTH_REFRESH_COOKIE_NAME = 'nbos_refresh';
    const cleared = serializeRefreshCookie(buildClearRefreshCookieOptions());
    expect(cleared).toContain('Max-Age=0');
    expect(cleared).toContain('nbos_refresh=');
    expect(cleared).toContain('HttpOnly');
  });

  it('parses named cookie from Set-Cookie headers', () => {
    const headers = [
      'other=1; Path=/',
      'nbos_refresh=abc.def%2Fghi; Max-Age=100; Path=/api/auth; HttpOnly; SameSite=Lax; Secure',
    ];
    expect(parseNamedCookieFromSetCookieHeaders(headers, 'nbos_refresh')).toBe('abc.def/ghi');
    expect(parseNamedCookieFromSetCookieHeaders(headers, 'missing')).toBeUndefined();
  });
});
