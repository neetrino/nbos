import { isRoleVisibleInAssignmentPicker } from '@nbos/shared';
import type { RoleItem } from '@/lib/api/employees';

/** UI filter only. API `canAssignRole` remains the enforcement gate. */
export function filterRolesForAssignmentPicker(
  roles: RoleItem[],
  actorIsPlatformOwner: boolean,
  currentRoleId?: string,
): RoleItem[] {
  return roles.filter((role) => {
    if (currentRoleId && role.id === currentRoleId) return true;
    return isRoleVisibleInAssignmentPicker({
      roleSlug: role.slug,
      assignable: role.assignable !== false,
      actorIsPlatformOwner,
    });
  });
}
