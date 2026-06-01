import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { TokenDenylistService } from '../security/token-denylist.service';

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

describe('AuthGuard', () => {
  const testSecret = 'test-secret';
  let guard: AuthGuard;
  let reflector: Reflector;
  let denylist: TokenDenylistService;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    denylist = new TokenDenylistService();
    const configService = {
      getOrThrow: vi.fn().mockReturnValue(testSecret),
    } as unknown as ConfigService;
    guard = new AuthGuard(reflector, configService, denylist);
  });

  it('allows access to public routes', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws when no authorization header', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws when authorization is not Bearer', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Basic abc' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws on invalid token', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const { context } = createMockContext({ authorization: 'Bearer bad-token' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('sets user on request for valid token', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign({ sub: 'emp_123', email: 'test@example.com' }, testSecret);
    const { context, request } = createMockContext({ authorization: `Bearer ${token}` });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({
      employeeId: 'emp_123',
      email: 'test@example.com',
    });
  });

  it('throws when the token jti has been revoked', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign({ sub: 'emp_123', email: 'test@example.com' }, testSecret, {
      jwtid: 'jti-revoked',
      expiresIn: '1h',
    });
    denylist.revokeUntil('jti-revoked', Date.now() + 3_600_000);
    const { context } = createMockContext({ authorization: `Bearer ${token}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws when token is signed with a different secret', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const token = jwt.sign({ sub: 'emp_123', email: 'test@example.com' }, 'wrong-secret');
    const { context } = createMockContext({ authorization: `Bearer ${token}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
