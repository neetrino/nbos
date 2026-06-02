import type { CurrentUserPayload } from '../../common/decorators';

/** Caller identity + RBAC scope for project-scoped task lists. */
export interface TasksAccessContext {
  employeeId: string;
  departmentIds: string[];
  /** RBAC `TASKS_VIEW` scope; ALL bypasses project participation gate. */
  viewScope?: string;
}

export function tasksViewBypassesRowFilter(scope: string | undefined): boolean {
  return scope?.trim().toUpperCase() === 'ALL';
}

export function tasksAccessFromUser(user: CurrentUserPayload): TasksAccessContext {
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    viewScope: user.permissions.TASKS_VIEW,
  };
}
