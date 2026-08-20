import { isRoleVisibleInAssignmentPicker } from '@nbos/shared';
import type { RoleItem } from '@/lib/api/employees';

export function assignmentPickerActor(
  me:
    | {
        isPlatformOwner?: boolean;
        role: { slug: string };
      }
    | null
    | undefined,
): { isPlatformOwner: boolean; roleSlug: string } {
  return {
    isPlatformOwner: me?.isPlatformOwner === true,
    roleSlug: me?.role.slug ?? '',
  };
}

/** UI filter only. API `canAssignRole` remains the enforcement gate. */
export function filterRolesForAssignmentPicker(
  roles: RoleItem[],
  actor: { isPlatformOwner: boolean; roleSlug: string },
  currentRoleId?: string,
): RoleItem[] {
  return roles.filter((role) => {
    if (currentRoleId && role.id === currentRoleId) return true;
    return isRoleVisibleInAssignmentPicker({
      roleSlug: role.slug,
      assignable: role.assignable !== false,
      actorIsPlatformOwner: actor.isPlatformOwner,
      actorRoleSlug: actor.roleSlug,
    });
  });
}
