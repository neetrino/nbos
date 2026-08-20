import { type PlatformOwnerIntegrityReason, CEO_ROLE_SLUG } from './constants';

const ACTIVE_FOUNDER_STATUSES = new Set(['ACTIVE', 'PROBATION']);

export function normalizeFounderEmployeeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function evaluateIsPlatformOwner(params: {
  employeeId: string;
  employeeStatus: string | null | undefined;
  ownerEmployeeId: string | null | undefined;
  founderEmployeeIdEnv: string | null | undefined;
}): { ok: boolean; reason: PlatformOwnerIntegrityReason } {
  const envId = normalizeFounderEmployeeId(params.founderEmployeeIdEnv);
  const dbId = normalizeFounderEmployeeId(params.ownerEmployeeId);
  if (!dbId) return { ok: false, reason: 'no_ownership_row' };
  if (!envId) return { ok: false, reason: 'env_missing' };
  if (envId !== dbId) return { ok: false, reason: 'mismatch' };
  if (params.employeeId !== dbId) return { ok: false, reason: 'id_mismatch' };
  const status = params.employeeStatus?.trim().toUpperCase() ?? '';
  if (!ACTIVE_FOUNDER_STATUSES.has(status)) return { ok: false, reason: 'inactive' };
  return { ok: true, reason: 'ok' };
}

/** Protect both the env-anchored person and the DB owner row if they diverge. */
export function isFounderProtectedEmployee(
  employeeId: string,
  ownerEmployeeId: string | null | undefined,
  founderEmployeeIdEnv: string | null | undefined,
): boolean {
  const envId = normalizeFounderEmployeeId(founderEmployeeIdEnv);
  const dbId = normalizeFounderEmployeeId(ownerEmployeeId);
  return employeeId === dbId || (envId !== null && employeeId === envId);
}

export function isCeoRoleSlug(roleSlug: string | null | undefined): boolean {
  return roleSlug?.trim().toLowerCase() === CEO_ROLE_SLUG;
}

export function hasCompanyExecutiveOps(params: {
  isPlatformOwner: boolean;
  roleSlug: string | null | undefined;
}): boolean {
  return params.isPlatformOwner || isCeoRoleSlug(params.roleSlug);
}

export function hasCompanyExecutiveOpsFromUser(
  user: { isPlatformOwner?: boolean; role?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  return hasCompanyExecutiveOps({
    isPlatformOwner: user.isPlatformOwner === true,
    roleSlug: user.role,
  });
}
