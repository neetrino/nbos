/** Single module + action checked by `can(action, module)`. */
export type PermissionClause = {
  module: string;
  action: string;
};

/**
 * Route or nav gate. A lone clause is the existing shape; `anyOf` is granted when
 * any listed clause is granted (OR). Empty `anyOf` is fail-closed.
 */
export type PermissionRequirement = PermissionClause | { anyOf: readonly PermissionClause[] };

export function isAnyOfPermissionRequirement(
  permission: PermissionRequirement,
): permission is { anyOf: readonly PermissionClause[] } {
  return 'anyOf' in permission;
}

export function getPermissionClauses(
  permission: PermissionRequirement,
): readonly PermissionClause[] {
  return isAnyOfPermissionRequirement(permission) ? permission.anyOf : [permission];
}
