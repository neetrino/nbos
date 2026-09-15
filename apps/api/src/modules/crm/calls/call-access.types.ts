import type { CurrentUserPayload } from '../../../common/decorators';
import { permissionDepartmentIds } from '../../../common/authorization/permission-department-scope';

/** Technical RBAC scopes for CRM Calls (CRM_LEADS / CRM_DEALS VIEW or EDIT). */
export type CallRbacScope = 'ALL' | 'OWN' | 'DEPARTMENT' | 'NONE';

/**
 * Object-level Calls capabilities. `view` uses CRM_*_VIEW; `editNote` uses CRM_*_EDIT.
 * Both reuse `buildCallAccessWhere` so Lead/Deal/Call predicates stay in one place.
 */
export type CallAccessCapability = 'view' | 'editNote';

export function callAccessPermissionAction(capability: CallAccessCapability): 'VIEW' | 'EDIT' {
  return capability === 'editNote' ? 'EDIT' : 'VIEW';
}

/** Authenticated employee used by Call object-level policy. */
export interface CallAccessActor {
  employeeId: string;
  departmentIds: string[];
  permissions: Record<string, string | undefined>;
  permissionDepartmentIds?: Record<string, string[]>;
}

export function callAccessActorFromUser(user: CurrentUserPayload): CallAccessActor {
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    permissions: user.permissions ?? {},
    permissionDepartmentIds: Object.fromEntries(
      ['CRM_LEADS_VIEW', 'CRM_DEALS_VIEW', 'CRM_LEADS_EDIT', 'CRM_DEALS_EDIT', 'CALLS_VIEW'].map(
        (key) => [key, permissionDepartmentIds(user, key)],
      ),
    ),
  };
}
