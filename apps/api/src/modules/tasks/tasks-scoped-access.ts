import type { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';

const SCOPE_DEPARTMENT = 'DEPARTMENT';

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

export async function loadTasksScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: TasksAccessContext,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  const scope = access.viewScope?.trim().toUpperCase() ?? 'NONE';
  if (scope !== SCOPE_DEPARTMENT || access.departmentIds.length === 0) {
    return [...ids];
  }
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return [...ids];
}
