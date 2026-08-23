import { describe, expect, it, beforeEach } from 'vitest';
import { AuthGuard } from '../../common/guards/auth.guard';
import * as jwt from 'jsonwebtoken';
import { resetAuthMetricsForTests, getAuthMetrics } from './auth-session.metrics';

describe('AuthGuard V2 only', () => {
  const secret = 'test-secret-at-least-32-characters!!';
  let guard: AuthGuard;

  beforeEach(() => {
    resetAuthMetricsForTests();
    guard = new AuthGuard(
      { getAllAndOverride: () => false } as never,
      { getOrThrow: () => secret } as never,
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

  it('accepts a V2 access token', async () => {
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
    expect(getAuthMetrics().auth_v2_token_requests_total).toBe(1);
    expect(getAuthMetrics().auth_denylist_reads_total).toBe(0);
  });

  it('rejects a legacy long-lived JWT', async () => {
    const token = jwt.sign({ sub: 'e1', email: 'a@b.c' }, secret, {
      expiresIn: '7d',
      jwtid: 'jti-1',
    });
    const c = ctx(token);
    await expect(guard.canActivate(c as never)).rejects.toThrow();
    expect(getAuthMetrics().auth_legacy_token_requests_total).toBe(0);
  });
});
