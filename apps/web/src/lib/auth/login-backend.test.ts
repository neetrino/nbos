import { afterEach, describe, expect, it, vi } from 'vitest';
import { BACKEND_LOGIN_ERROR, BackendLoginError, authorizeBackendLogin } from './login-backend';

function request(userAgent?: string): Request {
  return new Request('http://localhost:3000/api/auth/callback/credentials', {
    headers: userAgent ? { 'user-agent': userAgent } : undefined,
  });
}

function loginOk(): Response {
  return new Response(
    JSON.stringify({
      data: {
        accessToken: 'access',
        sessionId: 'sid',
        user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
      },
    }),
    {
      status: 200,
      headers: { 'Set-Cookie': 'nbos_refresh=sid.secret; Path=/api/auth; HttpOnly' },
    },
  );
}

describe('authorizeBackendLogin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('forwards the browser User-Agent and BFF marker to Nest', async () => {
    const fetchMock = vi.fn(async () => loginOk());
    vi.stubGlobal('fetch', fetchMock);

    const user = await authorizeBackendLogin(
      { email: 'a@b.c', password: 'secret1' },
      request('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0'),
    );

    expect(user?.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Nbos-Bff': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
        }),
      }),
    );
  });

  it('maps rate-limit and server failures away from invalid credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 429 })),
    );
    await expect(
      authorizeBackendLogin({ email: 'a@b.c', password: 'secret1' }, request()),
    ).rejects.toMatchObject({ code: BACKEND_LOGIN_ERROR.tooManyAttempts });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500 })),
    );
    await expect(
      authorizeBackendLogin({ email: 'a@b.c', password: 'secret1' }, request()),
    ).rejects.toBeInstanceOf(BackendLoginError);
    await expect(
      authorizeBackendLogin({ email: 'a@b.c', password: 'secret1' }, request()),
    ).rejects.toMatchObject({ code: BACKEND_LOGIN_ERROR.serviceUnavailable });
  });

  it('maps a deactivated account without calling it a wrong password', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Account deactivated' }), { status: 401 }),
      ),
    );

    await expect(
      authorizeBackendLogin({ email: 'a@b.c', password: 'secret1' }, request()),
    ).rejects.toMatchObject({ code: BACKEND_LOGIN_ERROR.accountDeactivated });
  });
});
