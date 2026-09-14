import type { CurrentUserPayload } from '../decorators';

/**
 * Departments a permission is scoped to. DEPARTMENT grants stay isolated to the
 * departments that granted them, so an extra seat role never widens another role.
 */
export function permissionDepartmentIds(user: CurrentUserPayload, permissionKey: string): string[] {
  if (!user.permissionGrants) return user.departmentIds ?? [];
  const grant = user.permissionGrants[permissionKey];
  // ALL still needs memberships for independent resource-level sharing rules.
  if (grant?.all) return withMemberships(user, grant.departmentIds);
  return grant?.departmentIds ?? [];
}

/**
 * Route-local scope stored by PermissionGuard. Unlike {@link permissionDepartmentIds}
 * it always keeps memberships, because consumers such as Drive resolve department-level
 * sharing from them regardless of the matched RBAC scope.
 */
export function routePermissionDepartmentIds(
  user: CurrentUserPayload,
  permissionKey: string,
): string[] {
  return withMemberships(user, user.permissionGrants?.[permissionKey]?.departmentIds ?? []);
}

export function currentRoutePermissionDepartmentIds(user: CurrentUserPayload): string[] {
  return user.requestPermissionDepartmentIds ?? user.departmentIds ?? [];
}

function withMemberships(user: CurrentUserPayload, departmentIds: readonly string[]): string[] {
  return [...new Set([...(user.departmentIds ?? []), ...departmentIds])];
}
