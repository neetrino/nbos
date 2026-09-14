export type PermissionScope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';

export type PermissionContribution = {
  key: string;
  scope: string;
  departmentIds: readonly string[];
};

export type EffectivePermissionGrant = {
  own: boolean;
  department: boolean;
  departmentIds: string[];
  all: boolean;
};

export type EffectivePermissionContext = {
  permissions: Record<string, PermissionScope>;
  grants: Record<string, EffectivePermissionGrant>;
};

export function buildEffectivePermissionContext(
  contributions: readonly PermissionContribution[],
): EffectivePermissionContext {
  const grants = new Map<string, MutablePermissionGrant>();
  for (const contribution of contributions) {
    const scope = toPermissionScope(contribution.scope);
    if (scope === 'NONE') continue;
    const grant = grants.get(contribution.key) ?? mutableGrant();
    applyContribution(grant, scope, contribution.departmentIds);
    grants.set(contribution.key, grant);
  }
  return toEffectiveContext(grants);
}

export function toPermissionScope(scope: string): PermissionScope {
  if (scope === 'OWN' || scope === 'DEPARTMENT' || scope === 'ALL') return scope;
  return 'NONE';
}

export function permissionKey(module: string, action: string): string {
  return `${module}_${action}`;
}

type MutablePermissionGrant = {
  own: boolean;
  department: boolean;
  departmentIds: Set<string>;
  all: boolean;
};

function mutableGrant(): MutablePermissionGrant {
  return { own: false, department: false, departmentIds: new Set<string>(), all: false };
}

function applyContribution(
  grant: MutablePermissionGrant,
  scope: PermissionScope,
  departmentIds: readonly string[],
): void {
  if (scope === 'ALL') {
    grant.all = true;
    return;
  }
  if (scope === 'OWN') {
    grant.own = true;
    return;
  }
  if (scope !== 'DEPARTMENT') return;
  grant.department = true;
  for (const departmentId of departmentIds) grant.departmentIds.add(departmentId);
}

function toEffectiveContext(
  entries: ReadonlyMap<string, MutablePermissionGrant>,
): EffectivePermissionContext {
  const permissions: Record<string, PermissionScope> = {};
  const grants: Record<string, EffectivePermissionGrant> = {};
  for (const [key, grant] of entries) {
    const frozen = {
      own: grant.own,
      department: grant.department,
      departmentIds: [...grant.departmentIds],
      all: grant.all,
    };
    grants[key] = frozen;
    permissions[key] = flattenedScope(frozen);
  }
  return { permissions, grants };
}

function flattenedScope(grant: EffectivePermissionGrant): PermissionScope {
  if (grant.all) return 'ALL';
  if (grant.department) return 'DEPARTMENT';
  if (grant.own) return 'OWN';
  return 'NONE';
}
