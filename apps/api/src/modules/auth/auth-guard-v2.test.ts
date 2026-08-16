import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthGuard } from '../../common/guards/auth.guard';
import * as jwt from 'jsonwebtoken';
import { resetAuthMetricsForTests, getAuthMetrics } from './auth-session.metrics';

describe('AuthGuard legacy/V2 overlap', () => {
  const secret = 'test-secret-at-least-32-characters!!';
  let guard: AuthGuard;
  let denylist: { isRevoked: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    resetAuthMetricsForTests();
    process.env.AUTH_SESSION_V2_ACCEPT_ENABLED = 'true';
    process.env.AUTH_LEGACY_TOKEN_ACCEPT_ENABLED = 'true';
    process.env.AUTH_LEGACY_DENYLIST_READ_ENABLED = 'true';
    denylist = { isRevoked: vi.fn().mockResolvedValue(false) };
    guard = new AuthGuard(
      { getAllAndOverride: () => false } as never,
      { getOrThrow: () => secret } as never,
      denylist as never,
    );
  });

  function ctx(token: string) {
    const request = { headers: { authorization: `Bearer ${token}` }, user: undefined as unknown };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  }

  it('V2 token skips denylist', async () => {
    const token = jwt.sign(
      {
        sub: 'e1',
        email: 'a@b.c',
        sid: 's1',
        typ: 'access',
        ver: 2,
        authVersion: 1,
      },
      secret,
      { expiresIn: 600 },
    );
    const c = ctx(token);
    await expect(guard.canActivate(c as never)).resolves.toBe(true);
    expect(denylist.isRevoked).not.toHaveBeenCalled();
    expect(getAuthMetrics().auth_v2_token_requests_total).toBe(1);
    expect(getAuthMetrics().auth_denylist_reads_total).toBe(0);
  });

  it('legacy token uses denylist', async () => {
    const token = jwt.sign({ sub: 'e1', email: 'a@b.c' }, secret, {
      expiresIn: '7d',
      jwtid: 'jti-1',
    });
    const c = ctx(token);
    await expect(guard.canActivate(c as never)).resolves.toBe(true);
    expect(denylist.isRevoked).toHaveBeenCalledWith('jti-1');
    expect(getAuthMetrics().auth_legacy_token_requests_total).toBe(1);
    expect(getAuthMetrics().auth_denylist_reads_total).toBe(1);
  });

  it('rejects invalid token type on V2 shape without accept', async () => {
    process.env.AUTH_SESSION_V2_ACCEPT_ENABLED = 'false';
    const token = jwt.sign(
      {
        sub: 'e1',
        email: 'a@b.c',
        sid: 's1',
        typ: 'access',
        ver: 2,
        authVersion: 1,
      },
      secret,
      { expiresIn: 600 },
    );
    const c = ctx(token);
    await expect(guard.canActivate(c as never)).rejects.toThrow();
  });
});
