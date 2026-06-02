import type { AccessScopeMode } from '@nbos/shared';

const RBAC_DRIVE_SCOPES = ['OWN', 'DEPARTMENT', 'ALL'] as const;
type RbacDriveScope = (typeof RBAC_DRIVE_SCOPES)[number];

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

/**
 * Merges RBAC `DRIVE_VIEW` ceiling with Settings role/personal policy for family `DRIVE`.
 * Policy `ASSIGNED` / `NONE` narrow company-wide RBAC to participation + own + grants path (`OWN`).
 */
export function mergeDriveEffectiveScope(
  rbacScope: string | undefined,
  policyMode: AccessScopeMode,
): RbacDriveScope {
  const rbac = normalizeRbacDriveScope(rbacScope);

  if (policyMode === 'NONE' || policyMode === 'ASSIGNED') {
    return 'OWN';
  }

  return rbac;
}

/** For tests and diagnostics. */
export function rbacDriveScopeBreadth(scope: string | undefined): number {
  return RBAC_BREADTH[normalizeRbacDriveScope(scope)];
}
