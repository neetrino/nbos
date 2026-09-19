import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { DELIVERY_COMPENSATION_RULES_MODULE, FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { PermissionGuard } from '../../common/guards/permission.guard';

function activate(
  requirement: { module: string; action: string },
  permissions?: Record<string, string>,
) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(requirement),
  } as unknown as Reflector;
  const guard = new PermissionGuard(reflector);
  const request = {
    user: permissions ? { permissions, departmentIds: [] } : undefined,
  };
  return guard.canActivate({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as never);
}

describe('delivery compensation permission boundary', () => {
  it('lets a PM read the catalog and blocks rules', () => {
    const pm = {
      FUNCTION_CATALOG_VIEW: 'ALL',
      FUNCTION_CATALOG_EDIT: 'ALL',
      FUNCTION_CATALOG_ADD: 'ALL',
    };
    expect(activate({ module: FUNCTION_CATALOG_MODULE, action: 'VIEW' }, pm)).toBe(true);
    expect(() =>
      activate({ module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'VIEW' }, pm),
    ).toThrow(ForbiddenException);
  });

  it('lets Finance open bonuses but not catalog rules or catalog writes', () => {
    const finance = {
      FINANCE_BONUSES_VIEW: 'ALL',
      FINANCE_SALARY_VIEW: 'ALL',
      COMPANY_VIEW: 'ALL',
    };
    expect(() => activate({ module: FUNCTION_CATALOG_MODULE, action: 'VIEW' }, finance)).toThrow(
      ForbiddenException,
    );
    expect(() =>
      activate({ module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'VIEW' }, finance),
    ).toThrow(ForbiddenException);
  });

  it('does not treat COMPANY or FINANCE_BONUSES as RULES', () => {
    const hr = { COMPANY_VIEW: 'ALL', COMPANY_EDIT: 'ALL' };
    expect(() =>
      activate({ module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'EDIT' }, hr),
    ).toThrow(ForbiddenException);
  });

  it('lets Owner read rules', () => {
    expect(
      activate(
        { module: DELIVERY_COMPENSATION_RULES_MODULE, action: 'VIEW' },
        { DELIVERY_COMPENSATION_RULES_VIEW: 'ALL' },
      ),
    ).toBe(true);
  });
});
