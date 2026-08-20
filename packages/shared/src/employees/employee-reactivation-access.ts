import { hasCompanyExecutiveOps } from '../platform-ownership/evaluate-platform-owner';

/** HR department slug — members may reactivate (see canon: HR Director). */
export const EMPLOYEE_REACTIVATION_HR_DEPARTMENT_SLUG = 'hr';

export interface EmployeeReactivationActor {
  roleSlug: string;
  isPlatformOwner?: boolean;
  departmentSlugs: readonly string[];
}

/** Whether the actor may reactivate a terminated employee profile. */
export function canEmployeeReactivate(actor: EmployeeReactivationActor): boolean {
  if (
    hasCompanyExecutiveOps({
      isPlatformOwner: actor.isPlatformOwner === true,
      roleSlug: actor.roleSlug,
    })
  ) {
    return true;
  }
  return actor.departmentSlugs.some(
    (slug) => slug.toLowerCase() === EMPLOYEE_REACTIVATION_HR_DEPARTMENT_SLUG,
  );
}
