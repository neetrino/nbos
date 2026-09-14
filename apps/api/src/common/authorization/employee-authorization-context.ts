import {
  buildEffectivePermissionContext,
  permissionKey,
  type EffectivePermissionContext,
  type PermissionContribution,
} from './effective-permissions';

export type AuthorizationRole = {
  id: string;
  name: string;
  slug: string;
  level: number;
  permissions: AuthorizationRolePermission[];
};

export type AuthorizationRolePermission = {
  scope: string;
  permission: { module: string; action: string };
};

export type AuthorizationRoleAssignment = {
  scopeDepartmentId: string | null;
  role: AuthorizationRole;
};

export type EmployeeAuthorizationContext = EffectivePermissionContext & {
  roles: Array<Pick<AuthorizationRole, 'id' | 'name' | 'slug' | 'level'>>;
};

export function buildEmployeeAuthorizationContext(params: {
  legacyRole: AuthorizationRole;
  assignments: readonly AuthorizationRoleAssignment[];
  departmentIds: readonly string[];
}): EmployeeAuthorizationContext {
  // Only the legacy primary role spans every membership. An additional role carries
  // exactly the department it was granted for, so a dropped scope narrows instead of widening.
  const contributions = [
    ...roleContributions(params.legacyRole, params.departmentIds),
    ...params.assignments.flatMap((assignment) =>
      roleContributions(
        assignment.role,
        assignment.scopeDepartmentId ? [assignment.scopeDepartmentId] : [],
      ),
    ),
  ];
  const context = buildEffectivePermissionContext(contributions);
  return { ...context, roles: uniqueRoleSummaries(params.legacyRole, params.assignments) };
}

function roleContributions(
  role: AuthorizationRole,
  departmentIds: readonly string[],
): PermissionContribution[] {
  return role.permissions.map((item) => ({
    key: permissionKey(item.permission.module, item.permission.action),
    scope: item.scope,
    departmentIds,
  }));
}

function uniqueRoleSummaries(
  legacyRole: AuthorizationRole,
  assignments: readonly AuthorizationRoleAssignment[],
): EmployeeAuthorizationContext['roles'] {
  const roles = new Map<string, AuthorizationRole>();
  roles.set(legacyRole.id, legacyRole);
  for (const assignment of assignments) roles.set(assignment.role.id, assignment.role);
  return [...roles.values()].map(({ id, name, slug, level }) => ({ id, name, slug, level }));
}
