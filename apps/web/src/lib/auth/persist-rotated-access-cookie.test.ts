import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('./ensure-backend-access-token', () => ({
  ensureBackendAccessToken: vi.fn(),
}));

import { persistRotatedAccessCookie } from './persist-rotated-access-cookie';
import { ensureBackendAccessToken } from './ensure-backend-access-token';

function jwtWithExpiry(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `header.${payload}.signature`;
}

describe('persistRotatedAccessCookie', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('leaves a usable access token untouched', async () => {
    const accessToken = jwtWithExpiry(Math.floor(Date.now() / 1000) + 120);
    const response = NextResponse.next();

    await expect(
      persistRotatedAccessCookie(
        new NextRequest('http://localhost:3000/dashboard'),
        { accessToken, sessionId: 'session-a' },
        response,
      ),
    ).resolves.toBe('ok');

    expect(ensureBackendAccessToken).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('persists a freshly rotated Auth.js cookie after ordinary access expiry', async () => {
    const accessToken = jwtWithExpiry(Math.floor(Date.now() / 1000) - 1);
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({
      kind: 'available',
      accessToken: 'fresh-access',
      setCookie: 'authjs.session-token=rotated',
    });
    const response = NextResponse.next();

    await persistRotatedAccessCookie(
      new NextRequest('http://localhost:3000/dashboard'),
      { accessToken, sessionId: 'session-a' },
      response,
    );

    expect(response.headers.get('set-cookie')).toBe('authjs.session-token=rotated');
  });

  it('expires the Auth.js cookie when refresh says the session is gone', async () => {
    const accessToken = jwtWithExpiry(Math.floor(Date.now() / 1000) - 1);
    vi.mocked(ensureBackendAccessToken).mockResolvedValue({ kind: 'session-invalid' });
    const response = NextResponse.next();

    await expect(
      persistRotatedAccessCookie(
        new NextRequest('http://localhost:3000/dashboard'),
        { accessToken, sessionId: 'session-a' },
        response,
      ),
    ).resolves.toBe('session-invalid');

    expect(response.headers.get('set-cookie')).toContain('authjs.session-token=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
