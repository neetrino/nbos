import { describe, expect, it } from 'vitest';
import {
  parseRefreshTokenFromSetCookieHeaders,
  readSetCookieHeaderLines,
  resolveWebAuthRefreshCookieName,
} from './parse-nest-refresh-cookie';

describe('parse-nest-refresh-cookie', () => {
  it('resolves cookie name from env with default', () => {
    expect(resolveWebAuthRefreshCookieName({})).toBe('nbos_refresh');
    expect(resolveWebAuthRefreshCookieName({ AUTH_REFRESH_COOKIE_NAME: ' custom ' })).toBe(
      'custom',
    );
  });

  it('extracts refresh token from Nest Set-Cookie lines', () => {
    const token = parseRefreshTokenFromSetCookieHeaders(
      ['nbos_refresh=session.secret; Max-Age=100; Path=/api/auth; HttpOnly; SameSite=Lax; Secure'],
      'nbos_refresh',
    );
    expect(token).toBe('session.secret');
  });

  it('does not read refreshToken from unrelated cookies', () => {
    expect(
      parseRefreshTokenFromSetCookieHeaders(
        ['session=abc; Path=/', 'nbos_refresh=; Path=/api/auth; HttpOnly'],
        'nbos_refresh',
      ),
    ).toBeUndefined();
  });

  it('reads getSetCookie when available', () => {
    const headers = {
      getSetCookie: () => ['nbos_refresh=from-array; HttpOnly'],
      get: () => null,
    } as unknown as Headers;
    expect(readSetCookieHeaderLines(headers)).toEqual(['nbos_refresh=from-array; HttpOnly']);
  });
});
