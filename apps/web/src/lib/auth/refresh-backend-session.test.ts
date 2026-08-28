import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
  encode: vi.fn(),
}));

import { encode, getToken } from 'next-auth/jwt';
import { refreshBackendSession } from './refresh-backend-session';

const PRESENTED_REFRESH = 'session-a.old-secret';

function request(): NextRequest {
  return new NextRequest('http://localhost:3000/api/bff/v1/me');
}

function successBody(accessToken = 'fresh-access'): string {
  return JSON.stringify({
    data: {
      accessToken,
      sessionId: 'session-a',
      user: {
        id: 'employee-a',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'User',
      },
    },
  });
}

describe('refreshBackendSession', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('stores a rotated refresh and aligns the Auth.js cookie to the refresh TTL', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    vi.stubEnv('AUTH_REFRESH_TOKEN_TTL_DAYS', '30');
    vi.mocked(getToken).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: PRESENTED_REFRESH,
      sessionId: 'session-a',
    });
    vi.mocked(encode).mockResolvedValue('encrypted-session');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(successBody(), {
            status: 200,
            headers: {
              'Set-Cookie': 'nbos_refresh=session-a.new-secret; Path=/api/auth; HttpOnly',
            },
          }),
      ),
    );

    const result = await refreshBackendSession(request());

    expect(result).toEqual({
      kind: 'refreshed',
      accessToken: 'fresh-access',
      setCookie: expect.stringContaining('Max-Age=2592000'),
    });
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        maxAge: 2_592_000,
        token: expect.objectContaining({ refreshToken: 'session-a.new-secret' }),
      }),
    );
  });

  it('never overwrites the rotated cookie with a stale grace token', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    vi.mocked(getToken).mockResolvedValue({
      accessToken: 'expired-access',
      refreshToken: PRESENTED_REFRESH,
      sessionId: 'session-a',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(successBody(), { status: 200 })),
    );

    const result = await refreshBackendSession(request());

    expect(result).toEqual({ kind: 'refreshed', accessToken: 'fresh-access' });
    expect(encode).not.toHaveBeenCalled();
  });

  it('classifies only refresh 401 as an invalid session', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    vi.mocked(getToken).mockResolvedValue({ refreshToken: PRESENTED_REFRESH });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    await expect(refreshBackendSession(request())).resolves.toEqual({ kind: 'session-invalid' });
  });

  it('preserves refresh rate-limit semantics without invalidating the session', async () => {
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    vi.mocked(getToken).mockResolvedValue({ refreshToken: PRESENTED_REFRESH });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 429, headers: { 'Retry-After': '12' } })),
    );

    await expect(refreshBackendSession(request())).resolves.toEqual({
      kind: 'temporarily-unavailable',
      status: 429,
      retryAfter: '12',
    });
  });

  it('bounds a hung backend refresh and keeps the session retryable', async () => {
    vi.useFakeTimers();
    vi.stubEnv('AUTH_SECRET', 'test-secret');
    vi.mocked(getToken).mockResolvedValue({ refreshToken: PRESENTED_REFRESH });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );

    const result = refreshBackendSession(request());
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toEqual({ kind: 'temporarily-unavailable', status: 503 });
  });
});
