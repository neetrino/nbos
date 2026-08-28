import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
vi.mock('./refresh-backend-session', () => ({ refreshBackendSession: vi.fn() }));

import { getToken } from 'next-auth/jwt';
import { refreshBackendSession } from './refresh-backend-session';
import { ensureBackendAccessToken, isAccessTokenUsable } from './ensure-backend-access-token';
import { resetRefreshRegistryForTests } from './refresh-registry';

function jwtWithExpiry(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `header.${payload}.signature`;
}

function request(): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/realtime-token');
}

describe('ensureBackendAccessToken', () => {
  afterEach(() => {
    resetRefreshRegistryForTests();
    vi.clearAllMocks();
  });

  it('keeps an access token with more than 30 seconds remaining', async () => {
    const accessToken = jwtWithExpiry(Math.floor(Date.now() / 1000) + 60);
    vi.mocked(getToken).mockResolvedValue({ accessToken, sessionId: 'session-a' });

    await expect(ensureBackendAccessToken(request())).resolves.toEqual({
      kind: 'available',
      accessToken,
    });
    expect(refreshBackendSession).not.toHaveBeenCalled();
  });

  it('refreshes an expired realtime token before exposing it', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: jwtWithExpiry(Math.floor(Date.now() / 1000) - 1),
      sessionId: 'session-a',
    });
    vi.mocked(refreshBackendSession).mockResolvedValue({
      kind: 'refreshed',
      accessToken: 'fresh-access',
      setCookie: 'authjs.session-token=rotated',
    });

    await expect(ensureBackendAccessToken(request())).resolves.toEqual({
      kind: 'available',
      accessToken: 'fresh-access',
      setCookie: 'authjs.session-token=rotated',
    });
  });

  it('derives the single-flight key from an older cookie refresh when sessionId is absent', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: jwtWithExpiry(Math.floor(Date.now() / 1000) - 1),
      refreshToken: 'session-from-refresh.old-secret',
    });
    vi.mocked(refreshBackendSession).mockResolvedValue({
      kind: 'refreshed',
      accessToken: 'fresh-access',
    });

    await expect(ensureBackendAccessToken(request())).resolves.toEqual({
      kind: 'available',
      accessToken: 'fresh-access',
      setCookie: undefined,
    });
    expect(refreshBackendSession).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed and near-expiry access tokens', () => {
    expect(isAccessTokenUsable('malformed', 1_000_000)).toBe(false);
    expect(isAccessTokenUsable(jwtWithExpiry(1_029), 1_000_000)).toBe(false);
    expect(isAccessTokenUsable(jwtWithExpiry(1_031), 1_000_000)).toBe(true);
  });
});
