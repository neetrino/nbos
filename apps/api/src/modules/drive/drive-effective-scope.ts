import { hasCompanyExecutiveOpsFromUser, type AccessScopeMode } from '@nbos/shared';

type RbacDriveScope = 'OWN' | 'DEPARTMENT' | 'ALL';

const RBAC_BREADTH: Record<RbacDriveScope, number> = {
  OWN: 1,
  DEPARTMENT: 2,
  ALL: 3,
};

function normalizeRbacDriveScope(scope: string | undefined): RbacDriveScope {
  const key = scope?.trim().toUpperCase();
  if (key === 'DEPARTMENT' || key === 'ALL') return key;
  return 'OWN';
}

/** CEO seats and Founder identity: RBAC `DRIVE_VIEW:ALL` is not narrowed by default ASSIGNED policy. */
export function isGlobalDriveOwnerRole(
  roleSlug: string | undefined,
  isPlatformOwner = false,
): boolean {
  return hasCompanyExecutiveOpsFromUser({ isPlatformOwner, role: roleSlug });
}

export type MergeDriveEffectiveScopeOptions = {
  /** When true and RBAC ceiling is ALL, keep ALL even if platform policy is ASSIGNED. */
  globalOwnerRole?: boolean;
};

/**
 * Merges RBAC `DRIVE_VIEW` ceiling with Settings role/personal policy for family `DRIVE`.
 * Policy `ASSIGNED` / `NONE` narrow company-wide RBAC to participation + own + grants path (`OWN`).
 */
export function mergeDriveEffectiveScope(
  rbacScope: string | undefined,
  policyMode: AccessScopeMode,
  options?: MergeDriveEffectiveScopeOptions,
): RbacDriveScope {
  const rbac = normalizeRbacDriveScope(rbacScope);

  if (options?.globalOwnerRole && rbac === 'ALL') {
    return 'ALL';
  }

  if (policyMode === 'NONE' || policyMode === 'ASSIGNED') {
    return 'OWN';
  }

  return rbac;
}

/** For tests and diagnostics. */
export function rbacDriveScopeBreadth(scope: string | undefined): number {
  return RBAC_BREADTH[normalizeRbacDriveScope(scope)];
}
