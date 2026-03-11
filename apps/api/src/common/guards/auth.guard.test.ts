import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

const mockVerifyToken = vi.fn();
vi.mock('@clerk/backend', () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

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
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    const configService = {
      get: vi.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    guard = new AuthGuard(reflector, configService);
  });

  it('allows access to public routes', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const { context } = createMockContext();
    expect(await guard.canActivate(context)).toBe(true);
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
    mockVerifyToken.mockRejectedValue(new Error('invalid'));
    const { context } = createMockContext({ authorization: 'Bearer bad-token' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('sets user on request for valid token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockVerifyToken.mockResolvedValue({
      sub: 'user_123',
      email: 'test@example.com',
      sid: 'session_456',
    });
    const { context, request } = createMockContext({ authorization: 'Bearer valid-token' });
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual({
      clerkUserId: 'user_123',
      email: 'test@example.com',
      sessionId: 'session_456',
    });
  });

  it('passes secretKey to verifyToken', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockVerifyToken.mockResolvedValue({ sub: 'u1', sid: 's1' });
    const { context } = createMockContext({ authorization: 'Bearer token' });
    await guard.canActivate(context);
    expect(mockVerifyToken).toHaveBeenCalledWith('token', { secretKey: 'test-secret' });
  });
});
