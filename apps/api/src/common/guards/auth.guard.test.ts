import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

function createMockContext(headers: Record<string, string> = {}): {
  context: ExecutionContext;
  request: { headers: Record<string, string>; user?: Record<string, unknown> };
} {
  const request = { headers, user: undefined as Record<string, unknown> | undefined };
  return {
    request,
    context: {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext,
  };
}

function signV2(secret: string, extra: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: 'emp_123',
      email: 'test@example.com',
      sid: 'sess_1',
      typ: 'access',
      ver: 2,
      authVersion: 1,
      ...extra,
    },
    secret,
    { expiresIn: 600, jwtid: 'jti-1' },
  );
}

describe('AuthGuard', () => {
  const testSecret = 'test-secret';
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    const configService = {
      getOrThrow: vi.fn().mockReturnValue(testSecret),
    } as unknown as ConfigService;
    guard = new AuthGuard(reflector, configService);
  });

  it('allows access to public routes', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws when no authorization header', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when authorization is not Bearer', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Basic abc' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws on invalid token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Bearer bad-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('sets user on request for a V2 access token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = signV2(testSecret);
    const { context, request } = createMockContext({ authorization: `Bearer ${token}` });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({
      employeeId: 'emp_123',
      email: 'test@example.com',
      sessionId: 'sess_1',
      tokenVersion: 2,
      authVersion: 1,
      jti: 'jti-1',
    });
  });

  it('rejects a legacy long-lived JWT', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign({ sub: 'emp_123', email: 'test@example.com' }, testSecret, {
      jwtid: 'jti-legacy',
      expiresIn: '7d',
    });
    const { context } = createMockContext({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('throws when token is signed with a different secret', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = signV2('wrong-secret');
    const { context } = createMockContext({ authorization: `Bearer ${token}` });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
