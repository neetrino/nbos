'use client';

import { canEmployeeReactivate } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';

/** Whether the signed-in user may reactivate terminated employees. */
export function useCanReactivateEmployee(): boolean {
  const { me } = usePermission();
  if (!me) return false;

  return canEmployeeReactivate({
    roleSlug: me.role.slug,
    isPlatformOwner: me.isPlatformOwner === true,
    departmentSlugs: me.departments.map((row) => row.department.slug),
  });
}
