import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequiredPermission } from '../decorators/require-permission.decorator';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
  const guard = new PermissionGuard(reflector);

  function ctx(
    permissions?: Record<string, string>,
    permissionGrants?: Record<string, { departmentIds: string[] }>,
  ) {
    const request: {
      user?: {
        permissions?: Record<string, string>;
        permissionGrants?: Record<string, { departmentIds: string[] }>;
        departmentIds: string[];
        requestPermissionDepartmentIds?: string[];
      };
      permissionScope?: string;
    } = {
      user: permissions
        ? { permissions, permissionGrants, departmentIds: ['legacy-dept'] }
        : undefined,
    };
    return {
      context: {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => request }),
      } as never,
      request,
    };
  }

  function requires(requirement: RequiredPermission | RequiredPermission[] | undefined) {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(requirement);
  }

  beforeEach(() => {
    vi.mocked(reflector.getAllAndOverride).mockReset();
  });

  it('allows a handler without a permission decorator', () => {
    requires(undefined);
    expect(guard.canActivate(ctx().context)).toBe(true);
  });

  it('rejects a request that carries no permissions', () => {
    requires({ module: 'MARKETING', action: 'VIEW' });
    expect(() => guard.canActivate(ctx().context)).toThrow(ForbiddenException);
  });

  it('exposes the granted scope for a single requirement', () => {
    requires({ module: 'MARKETING', action: 'VIEW' });
    const { context, request } = ctx({ MARKETING_VIEW: 'DEPARTMENT' });

    expect(guard.canActivate(context)).toBe(true);
    expect(request.permissionScope).toBe('DEPARTMENT');
  });

  it('unions granted departments with memberships for the matched permission', () => {
    requires({ module: 'MARKETING', action: 'VIEW' });
    const { context, request } = ctx(
      { MARKETING_VIEW: 'DEPARTMENT' },
      { MARKETING_VIEW: { departmentIds: ['marketing'] } },
    );

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user?.requestPermissionDepartmentIds).toEqual(['legacy-dept', 'marketing']);
  });

  it('falls back to memberships when the matched permission carries no departments', () => {
    requires({ module: 'MARKETING', action: 'VIEW' });
    const { context, request } = ctx(
      { MARKETING_VIEW: 'ALL' },
      { MARKETING_VIEW: { departmentIds: [] } },
    );

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user?.requestPermissionDepartmentIds).toEqual(['legacy-dept']);
  });

  it('treats a NONE scope as missing', () => {
    requires({ module: 'MARKETING', action: 'VIEW' });
    expect(() => guard.canActivate(ctx({ MARKETING_VIEW: 'NONE' }).context)).toThrow(
      ForbiddenException,
    );
  });

  describe('any-of requirements', () => {
    const anyOf: RequiredPermission[] = [
      { module: 'CRM_LEADS', action: 'VIEW' },
      { module: 'CRM_DEALS', action: 'VIEW' },
      { module: 'MARKETING', action: 'VIEW' },
    ];

    it('accepts a caller holding only the last permission', () => {
      requires(anyOf);
      const { context, request } = ctx({ MARKETING_VIEW: 'ALL' });

      expect(guard.canActivate(context)).toBe(true);
      expect(request.permissionScope).toBe('ALL');
    });

    it('resolves the scope from the first matching permission', () => {
      requires(anyOf);
      const { context, request } = ctx({ CRM_DEALS_VIEW: 'OWN', MARKETING_VIEW: 'ALL' });

      expect(guard.canActivate(context)).toBe(true);
      expect(request.permissionScope).toBe('OWN');
    });

    it('rejects a caller holding none of them and names all candidates', () => {
      requires(anyOf);

      expect(() => guard.canActivate(ctx({ TASKS_VIEW: 'ALL' }).context)).toThrow(
        'No permission: CRM_LEADS.VIEW or CRM_DEALS.VIEW or MARKETING.VIEW',
      );
    });
  });
});
