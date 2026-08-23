import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REQUIRE_ACTIVE_SESSION_KEY } from '../decorators/require-active-session.decorator';
import { RequireActiveSessionGuard } from './require-active-session.guard';

describe('RequireActiveSessionGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
  const authSessions = { assertSessionActive: vi.fn() };
  const guard = new RequireActiveSessionGuard(
    reflector,
    authSessions as unknown as ConstructorParameters<typeof RequireActiveSessionGuard>[1],
  );

  function ctx(user: Record<string, unknown> | undefined) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as never;
  }

  beforeEach(() => {
    vi.mocked(reflector.getAllAndOverride).mockReset();
    authSessions.assertSessionActive.mockReset();
    delete process.env.AUTH_LEGACY_TOKEN_ACCEPT_ENABLED;
  });

  it('skips when decorator is absent', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    await expect(guard.canActivate(ctx({ tokenVersion: 1 }))).resolves.toBe(true);
    expect(authSessions.assertSessionActive).not.toHaveBeenCalled();
  });

  it('rejects a request without a V2 session', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    await expect(guard.canActivate(ctx({ id: 'e1', tokenVersion: 1 }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authSessions.assertSessionActive).not.toHaveBeenCalled();
  });

  it('requires an ACTIVE V2 session', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    authSessions.assertSessionActive.mockResolvedValue(undefined);
    await expect(
      guard.canActivate(ctx({ id: 'e1', sessionId: 's1', tokenVersion: 2 })),
    ).resolves.toBe(true);
    expect(authSessions.assertSessionActive).toHaveBeenCalledWith('s1', 'e1');
  });

  it('rejects V2 without a session id', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(true);
    await expect(guard.canActivate(ctx({ id: 'e1', tokenVersion: 2 }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('reads the decorator metadata key', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    await guard.canActivate(ctx(undefined));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_ACTIVE_SESSION_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });
});
