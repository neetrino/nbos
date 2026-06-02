/** Platform roles allowed to reactivate terminated employees. */
export const EMPLOYEE_REACTIVATION_ROLE_SLUGS = ['owner', 'ceo'] as const;

/** HR department slug — members may reactivate (see canon: HR Director). */
export const EMPLOYEE_REACTIVATION_HR_DEPARTMENT_SLUG = 'hr';

export interface EmployeeReactivationActor {
  roleSlug: string;
  departmentSlugs: readonly string[];
}

/** Whether the actor may reactivate a terminated employee profile. */
export function canEmployeeReactivate(actor: EmployeeReactivationActor): boolean {
  if (
    (EMPLOYEE_REACTIVATION_ROLE_SLUGS as readonly string[]).includes(actor.roleSlug.toLowerCase())
  ) {
    return true;
  }
  return actor.departmentSlugs.some(
    (slug) => slug.toLowerCase() === EMPLOYEE_REACTIVATION_HR_DEPARTMENT_SLUG,
  );
}
