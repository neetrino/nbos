export const ROLE_PERMISSION_SCOPE_OPTIONS = ['NONE', 'OWN', 'DEPARTMENT', 'ALL'] as const;
export type RolePermissionScope = (typeof ROLE_PERMISSION_SCOPE_OPTIONS)[number];

export const ROLE_PERMISSION_ACTIONS = ['VIEW', 'EDIT', 'ADD', 'DELETE'] as const;
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export interface RoleListItem {
  id: string;
  name: string;
  slug: string;
  level: number;
  isSystem: boolean;
  _count?: { employees: number };
}

export interface RolePermissionDef {
  id: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface RolePermissionGrant {
  id: string;
  permissionId: string;
  scope: string;
  permission: RolePermissionDef;
}

export interface RoleWithPermissions extends RoleListItem {
  permissions: RolePermissionGrant[];
}

export function formatRolePermissionModuleName(module: string): string {
  return module.replace(/_/g, ' ');
}

export function rolePermissionScopeKey(module: string, action: string): string {
  return `${module}:${action}`;
}

export function buildRoleMatrixScopes(
  rolePermissions: RolePermissionGrant[],
  allPermissions: RolePermissionDef[],
): Record<string, RolePermissionScope> {
  const scopes: Record<string, RolePermissionScope> = {};
  for (const grant of rolePermissions) {
    const key = rolePermissionScopeKey(grant.permission.module, grant.permission.action);
    scopes[key] = (ROLE_PERMISSION_SCOPE_OPTIONS as readonly string[]).includes(grant.scope)
      ? (grant.scope as RolePermissionScope)
      : 'NONE';
  }
  for (const permission of allPermissions) {
    const key = rolePermissionScopeKey(permission.module, permission.action);
    if (!(key in scopes)) scopes[key] = 'NONE';
  }
  return scopes;
}
