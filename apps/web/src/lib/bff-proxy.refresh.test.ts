import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('./auth/refresh-backend-session', () => ({
  refreshBackendSession: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';
import { refreshBackendSession } from './auth/refresh-backend-session';
import { resetRefreshRegistryForTests } from './auth/refresh-registry';
import { proxyToBackend } from './bff-proxy';

const FRESH_ACCESS = 'fresh-access-token';
const EXPIRED_ACCESS = 'expired-access-token';

function jwtWithExpiry(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `header.${payload}.signature`;
}

function backendRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/bff/${path}`);
}

describe('proxyToBackend concurrent refresh', () => {
  afterEach(() => {
    resetRefreshRegistryForTests();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('retries every concurrent 401 with the rotated access token', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: EXPIRED_ACCESS,
      sessionId: 'session-a',
    });
    vi.mocked(refreshBackendSession).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 30));
      return {
        kind: 'refreshed',
        accessToken: FRESH_ACCESS,
        setCookie: 'authjs.session-token=rotated',
      };
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: URL, init?: RequestInit) => {
        const auth = new Headers(init?.headers).get('Authorization');
        if (auth === `Bearer ${FRESH_ACCESS}`) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response(JSON.stringify({ message: 'expired' }), { status: 401 });
      }),
    );

    const [first, second] = await Promise.all([
      proxyToBackend(backendRequest('v1/me'), ['v1', 'me']),
      proxyToBackend(backendRequest('v1/tasks'), ['v1', 'tasks']),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(refreshBackendSession).toHaveBeenCalledTimes(1);
    expect(first.headers.get('set-cookie')).toContain('authjs.session-token=rotated');
    expect(second.headers.get('set-cookie')).toContain('authjs.session-token=rotated');
  });

  it('keeps concurrent refreshes for different sessions isolated end to end', async () => {
    vi.mocked(getToken).mockImplementation(async ({ req }) => {
      const request = req as NextRequest;
      return request.nextUrl.pathname.endsWith('/v1/me')
        ? { accessToken: 'expired-a', sessionId: 'session-a' }
        : { accessToken: 'expired-b', sessionId: 'session-b' };
    });
    vi.mocked(refreshBackendSession).mockImplementation(async (req) => {
      if (req.nextUrl.pathname.endsWith('/v1/me')) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        return { kind: 'refreshed', accessToken: 'fresh-a' };
      }
      return { kind: 'refreshed', accessToken: 'fresh-b' };
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: URL, init?: RequestInit) => {
        const auth = new Headers(init?.headers).get('Authorization');
        const path = new URL(url).pathname;
        const accepted =
          (path.endsWith('/v1/me') && auth === 'Bearer fresh-a') ||
          (path.endsWith('/v1/tasks') && auth === 'Bearer fresh-b');
        return new Response(JSON.stringify({ accepted }), { status: accepted ? 200 : 401 });
      }),
    );

    const [a, b] = await Promise.all([
      proxyToBackend(backendRequest('v1/me'), ['v1', 'me']),
      proxyToBackend(backendRequest('v1/tasks'), ['v1', 'tasks']),
    ]);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(refreshBackendSession).toHaveBeenCalledTimes(2);
  });

  it('marks only a confirmed refresh rejection as an invalid session', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: EXPIRED_ACCESS,
      sessionId: 'session-a',
    });
    vi.mocked(refreshBackendSession).mockResolvedValue({ kind: 'session-invalid' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'expired' }), { status: 401 })),
    );

    const response = await proxyToBackend(backendRequest('v1/me'), ['v1', 'me']);

    expect(response.status).toBe(401);
    expect(response.headers.get('x-nbos-session-invalid')).toBe('1');
  });

  it('returns refresh rate limiting without invalidating the session', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: EXPIRED_ACCESS,
      sessionId: 'session-a',
    });
    vi.mocked(refreshBackendSession).mockResolvedValue({
      kind: 'temporarily-unavailable',
      status: 429,
      retryAfter: '8',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'expired' }), { status: 401 })),
    );

    const response = await proxyToBackend(backendRequest('v1/me'), ['v1', 'me']);

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('8');
    expect(response.headers.get('x-nbos-session-invalid')).toBeNull();
  });

  it('does not invalidate the session when the retried business request is still 401', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: EXPIRED_ACCESS,
      sessionId: 'session-a',
    });
    vi.mocked(refreshBackendSession).mockResolvedValue({
      kind: 'refreshed',
      accessToken: FRESH_ACCESS,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Wrong current password' }), { status: 401 }),
      ),
    );

    const response = await proxyToBackend(backendRequest('v1/auth/change-password'), [
      'v1',
      'auth',
      'change-password',
    ]);

    expect(response.status).toBe(401);
    expect(response.headers.get('x-nbos-session-invalid')).toBeNull();
  });

  it('passes through a business 401 without rotating a still-usable access token', async () => {
    vi.mocked(getToken).mockResolvedValue({
      accessToken: jwtWithExpiry(Math.floor(Date.now() / 1000) + 300),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Wrong current password' }), { status: 401 }),
      ),
    );

    const response = await proxyToBackend(backendRequest('v1/auth/change-password'), [
      'v1',
      'auth',
      'change-password',
    ]);

    expect(response.status).toBe(401);
    expect(response.headers.get('x-nbos-session-invalid')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(refreshBackendSession).not.toHaveBeenCalled();
  });
});
