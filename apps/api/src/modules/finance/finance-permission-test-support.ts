import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { expect } from 'vitest';
import type { CurrentUserPayload } from '../../common/decorators';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from '../../common/decorators/require-permission.decorator';
import { PermissionGuard } from '../../common/guards/permission.guard';

export const GUESSED_RECORD_ID = 'guessed-record-id';

export function permissionOf(handler: unknown): RequiredPermission | undefined {
  return Reflect.getMetadata(PERMISSION_KEY, handler as object) as RequiredPermission | undefined;
}

export function handlerNames(controller: { prototype: object }): string[] {
  return Object.getOwnPropertyNames(controller.prototype).filter((name) => name !== 'constructor');
}

export function financePermissionUser(
  permissions: Record<string, string>,
  overrides: Partial<CurrentUserPayload> = {},
): CurrentUserPayload {
  return {
    id: 'emp-1',
    email: 'finance@nbos.test',
    role: 'custom',
    roleLevel: 4,
    departmentIds: [],
    firstName: 'Fin',
    lastName: 'Test',
    permissions,
    ...overrides,
  };
}

export function activateHandler(
  controller: { prototype: object },
  handlerName: string,
  permissions: Record<string, string>,
): boolean {
  const handler = (controller.prototype as Record<string, unknown>)[handlerName];
  if (typeof handler !== 'function') {
    throw new Error(`missing handler ${handlerName}`);
  }
  const reflector = {
    getAllAndOverride: () => permissionOf(handler),
  } as unknown as Reflector;
  const guard = new PermissionGuard(reflector);
  const request = {
    user: financePermissionUser(permissions),
    params: { id: GUESSED_RECORD_ID },
  };
  return guard.canActivate({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as never);
}

export function expectHandlerAllowed(
  controller: { prototype: object },
  handlerName: string,
  permissions: Record<string, string>,
): void {
  expect(activateHandler(controller, handlerName, permissions)).toBe(true);
}

export function expectHandlerDenied(
  controller: { prototype: object },
  handlerName: string,
  permissions: Record<string, string>,
): void {
  expect(() => activateHandler(controller, handlerName, permissions)).toThrow(ForbiddenException);
}

export function calledWheres(fn: {
  mock: { calls: ReadonlyArray<readonly unknown[]> };
}): unknown[] {
  return fn.mock.calls
    .map((call) => {
      const arg = call[0];
      if (!arg || typeof arg !== 'object' || !('where' in arg)) return undefined;
      return (arg as { where: unknown }).where;
    })
    .filter((where) => where !== undefined);
}

export function whereRequiresProjectParticipation(
  where: unknown,
  employeeIds: readonly string[],
): boolean {
  if (!where || typeof where !== 'object') return false;
  const record = where as Record<string, unknown>;
  if (projectFilterIncludesEmployees(record.project, employeeIds)) return true;
  const and = record.AND;
  if (!Array.isArray(and)) return false;
  return and.some((clause) => whereRequiresProjectParticipation(clause, employeeIds));
}

export function whereAllowsUnassignedProject(where: unknown): boolean {
  return JSON.stringify(where).includes('"projectId":null');
}

function projectFilterIncludesEmployees(project: unknown, employeeIds: readonly string[]): boolean {
  if (!project || typeof project !== 'object') return false;
  const serialized = JSON.stringify(project);
  return employeeIds.every((id) => serialized.includes(id));
}
