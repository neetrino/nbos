import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController public responses', () => {
  const setHeader = vi.fn();
  const res = { setHeader };

  const authService = {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  } as unknown as AuthService;

  let controller: AuthController;

  beforeEach(() => {
    setHeader.mockReset();
    vi.mocked(authService.login).mockReset();
    vi.mocked(authService.refresh).mockReset();
    controller = new AuthController(authService);
    process.env.AUTH_REFRESH_COOKIE_NAME = 'nbos_refresh';
    process.env.AUTH_COOKIE_SECURE = 'true';
    process.env.AUTH_COOKIE_SAME_SITE = 'lax';
  });

  it('login sets refresh cookie and omits refreshToken from JSON', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'sid.secret',
      sessionId: 'sid',
      tokenVersion: 2,
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.login({ email: 'a@b.c', password: 'x' }, { headers: {} }, res);

    expect(body).not.toHaveProperty('refreshToken');
    expect(body.accessToken).toBe('access');
    expect(setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringMatching(/^nbos_refresh=sid\.secret;.*HttpOnly/),
    );
    const cookieHeader = String(setHeader.mock.calls[0]?.[1] ?? '');
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('Path=/api/auth');
  });

  it('refresh sets rotated cookie and omits refreshToken from JSON', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'sid.new-secret',
      sessionId: 'sid',
      tokenVersion: 2,
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.refresh(
      { refreshToken: 'sid.old-secret' },
      { headers: {} },
      res,
      undefined,
      undefined,
      '1',
    );

    expect(body).not.toHaveProperty('refreshToken');
    expect(body.accessToken).toBe('access-2');
    expect(setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('nbos_refresh=sid.new-secret'),
    );
  });

  it('never returns refreshToken in JSON even when BFF marker is present', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'access-3',
      refreshToken: 'sid.rotated',
      sessionId: 'sid',
      tokenVersion: 2,
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.refresh(
      { refreshToken: 'sid.presented' },
      { headers: {} },
      res,
      undefined,
      undefined,
      '1',
    );

    expect(JSON.stringify(body)).not.toContain('sid.rotated');
    expect(body).not.toHaveProperty('refreshToken');
    expect(setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('nbos_refresh=sid.rotated'),
    );
  });

  it('does not set a stale refresh cookie for a grace-window response', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'access-from-grace',
      refreshToken: undefined,
      sessionId: 'sid',
      tokenVersion: 2,
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.refresh(
      { refreshToken: 'sid.previous' },
      { headers: {} },
      res,
      undefined,
      undefined,
      '1',
    );

    expect(body.accessToken).toBe('access-from-grace');
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('returns refreshToken in JSON for native clientKind without browser Origin', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'sid.native',
      sessionId: 'sid',
      tokenVersion: 2,
      clientKind: 'mobile_work',
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.login(
      { email: 'a@b.c', password: 'x', clientKind: 'mobile_work' },
      { headers: {} },
      res,
    );

    expect(body.refreshToken).toBe('sid.native');
    expect(authService.login).toHaveBeenCalledWith(
      'a@b.c',
      'x',
      expect.objectContaining({ clientKind: 'mobile_work' }),
    );
  });

  it('does not put refreshToken in JSON when Origin is a CORS browser origin', async () => {
    process.env.CORS_ORIGIN = 'https://app.example.com';
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'sid.secret',
      sessionId: 'sid',
      tokenVersion: 2,
      clientKind: 'web',
      user: { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' },
    });

    const body = await controller.login(
      { email: 'a@b.c', password: 'x', clientKind: 'mobile_work' },
      { headers: { origin: 'https://app.example.com' } },
      res,
    );

    expect(body).not.toHaveProperty('refreshToken');
    expect(authService.login).toHaveBeenCalledWith(
      'a@b.c',
      'x',
      expect.objectContaining({ clientKind: 'web' }),
    );
  });
});
