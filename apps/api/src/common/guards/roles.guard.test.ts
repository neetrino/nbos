import { describe, it, expect, vi } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';

function createMockContext(user?: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: vi.fn(),
      getNext: vi.fn(),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('allows access when roles is empty array', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('denies access when no user on request', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CEO']);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(createMockContext())).toBe(false);
  });

  it('allows access when user has required role', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CEO', 'SELLER']);
    const guard = new RolesGuard(reflector);
    const ctx = createMockContext({ role: 'CEO' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user has wrong role', () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['CEO']);
    const guard = new RolesGuard(reflector);
    const ctx = createMockContext({ role: 'DEVELOPER' });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
