import { describe, expect, it } from 'vitest';
import { parseSrcSetCookieHeaders } from './armenia-company-lookup.cookies';

describe('parseSrcSetCookieHeaders', () => {
  it('reads Laravel CSRF cookies and decodes the XSRF header token', () => {
    const encoded = 'abc%3D%3D';
    const parsed = parseSrcSetCookieHeaders([
      `XSRF-TOKEN=${encoded}; Path=/; SameSite=Lax`,
      'laravel_session=sess123; Path=/; HttpOnly',
    ]);
    expect(parsed).toEqual({
      cookieHeader: `XSRF-TOKEN=${encoded}; laravel_session=sess123`,
      csrfToken: 'abc==',
    });
  });

  it('returns null when the CSRF pair is missing', () => {
    expect(parseSrcSetCookieHeaders(['laravel_session=sess123; Path=/'])).toBeNull();
  });
});
