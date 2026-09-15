import { hasCompanyExecutiveOps } from '../platform-ownership/evaluate-platform-owner';

/**
 * HR role slug — its holders may reactivate (see canon: HR Manager).
 *
 * This used to key on the department slug `hr`, which silently stopped matching once the
 * department was renamed: reactivation quietly collapsed to CEO / Platform Owner with no error.
 * A role slug is stable because it is system-owned and locked in Settings.
 */
export const EMPLOYEE_REACTIVATION_HR_ROLE_SLUG = 'hr-manager';

export interface EmployeeReactivationActor {
  /** Primary role. Governance is never inherited from an additional role. */
  roleSlug: string;
  isPlatformOwner?: boolean;
  /** Every effective role, primary and additional — HR is commonly an additional role. */
  roleSlugs: readonly string[];
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
  return actor.roleSlugs.some(
    (slug) => slug.trim().toLowerCase() === EMPLOYEE_REACTIVATION_HR_ROLE_SLUG,
  );
}
