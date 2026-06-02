import type { PrismaClient } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';

/** Caller identity + RBAC VIEW scope for finance list/stats row filters. */
export interface FinanceScopedAccessContext {
  employeeId: string;
  departmentIds: string[];
  viewScope?: string;
}

const SCOPE_DEPARTMENT = 'DEPARTMENT';

export function financeScopedBypassRowFilter(scope: string | undefined): boolean {
  return scope?.trim().toUpperCase() === 'ALL';
}

export function financeScopedAccessFromUser(
  user: CurrentUserPayload,
  viewPermissionKey: string,
): FinanceScopedAccessContext {
  return {
    employeeId: user.id,
    departmentIds: user.departmentIds ?? [],
    viewScope: user.permissions[viewPermissionKey],
  };
}

export async function loadFinanceScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext,
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

export function mergeFinanceWhere<T extends object>(base: T, extra: T | undefined): T {
  if (!extra || Object.keys(extra).length === 0) return base;
  if (Object.keys(base).length === 0) return extra;
  return { AND: [base, extra] } as T;
}
