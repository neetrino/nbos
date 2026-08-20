import { CEO_ROLE_SLUG, PLATFORM_OWNER_ROLE_SLUG } from './constants';

export interface CanAssignRoleInput {
  actorIsPlatformOwner: boolean;
  actorRoleSlug: string;
  targetRoleSlug: string;
  targetRoleAssignable: boolean;
  /** True when another employee already holds CEO (not the assignment target). */
  ceoHeldByOtherEmployee: boolean;
}

export interface CanAssignRoleResult {
  allowed: boolean;
  reason: string;
}

export function canAssignRole(input: CanAssignRoleInput): CanAssignRoleResult {
  const target = input.targetRoleSlug.trim().toLowerCase();
  if (!input.targetRoleAssignable || target === PLATFORM_OWNER_ROLE_SLUG) {
    return { allowed: false, reason: 'Platform Owner is not an assignable role.' };
  }
  if (input.actorIsPlatformOwner) {
    if (target === CEO_ROLE_SLUG && input.ceoHeldByOtherEmployee) {
      return { allowed: false, reason: 'A CEO already exists. Demote the current CEO first.' };
    }
    return { allowed: true, reason: 'ok' };
  }
  const actor = input.actorRoleSlug.trim().toLowerCase();
  if (actor === CEO_ROLE_SLUG) {
    if (target === CEO_ROLE_SLUG) {
      return { allowed: false, reason: 'Only the platform owner can assign CEO.' };
    }
    return { allowed: true, reason: 'ok' };
  }
  return { allowed: false, reason: 'Only the platform owner or CEO can assign roles.' };
}

/** UI filter only. API `canAssignRole` remains the enforcement gate. */
export function isRoleVisibleInAssignmentPicker(params: {
  roleSlug: string;
  assignable: boolean;
  actorIsPlatformOwner: boolean;
  actorRoleSlug: string;
}): boolean {
  return canAssignRole({
    actorIsPlatformOwner: params.actorIsPlatformOwner,
    actorRoleSlug: params.actorRoleSlug,
    targetRoleSlug: params.roleSlug,
    targetRoleAssignable: params.assignable,
    ceoHeldByOtherEmployee: false,
  }).allowed;
}
