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
    vi.mocked(getToken).mockResolvedValue({ accessToken: EXPIRED_ACCESS });
    vi.mocked(refreshBackendSession).mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 30));
      return { accessToken: FRESH_ACCESS, setCookie: 'authjs.session-token=rotated' };
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
});
