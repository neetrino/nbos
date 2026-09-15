import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildClearAuthJsSessionCookie } from './clear-authjs-session-cookie';

describe('buildClearAuthJsSessionCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('expires the Auth.js session cookie without a token value', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const cookie = buildClearAuthJsSessionCookie();
    expect(cookie).toContain('authjs.session-token=');
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).not.toContain('Secure');
  });

  it('uses the Secure cookie name in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const cookie = buildClearAuthJsSessionCookie();
    expect(cookie.startsWith('__Secure-authjs.session-token=')).toBe(true);
    expect(cookie).toContain('Secure');
  });
});
