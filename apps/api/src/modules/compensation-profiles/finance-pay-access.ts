import { BadRequestException, ForbiddenException } from '@nestjs/common';

export const FINANCE_SALARY_MODULE = 'FINANCE_SALARY';
export const FINANCE_BONUSES_MODULE = 'FINANCE_BONUSES';

export type FinancePayScope = 'NONE' | 'OWN' | 'DEPARTMENT' | 'ALL';

export type FinancePayActor = {
  id: string;
  permissions: Record<string, string | undefined>;
  departmentIds: string[];
  requestPermissionDepartmentIds?: string[];
};

export type AccessibleEmployeeIds = 'ALL' | string[];

type EmployeeDepartmentReader = {
  employeeDepartment: {
    findMany: (args: {
      where: { departmentId: { in: string[] } };
      select: { employeeId: true };
    }) => Promise<Array<{ employeeId: string }>>;
  };
};

const SCOPES: readonly FinancePayScope[] = ['NONE', 'OWN', 'DEPARTMENT', 'ALL'];

export function financePayScope(
  actor: FinancePayActor,
  module: string,
  action: string,
): FinancePayScope {
  const raw = actor.permissions[`${module}_${action}`]?.trim().toUpperCase();
  return SCOPES.includes(raw as FinancePayScope) ? (raw as FinancePayScope) : 'NONE';
}

export function assertFinancePayScope(
  actor: FinancePayActor,
  module: string,
  action: string,
  allowed: readonly FinancePayScope[],
): FinancePayScope {
  const scope = financePayScope(actor, module, action);
  if (scope === 'NONE' || !allowed.includes(scope)) {
    throw new ForbiddenException(`No permission: ${module}.${action}`);
  }
  return scope;
}

export function assertCompanyWideFinanceAccess(
  actor: FinancePayActor,
  module: string,
  action: string,
): void {
  assertFinancePayScope(actor, module, action, ['ALL']);
}

export function departmentIdsForPayAccess(actor: FinancePayActor): string[] {
  return actor.requestPermissionDepartmentIds ?? actor.departmentIds ?? [];
}

export async function resolveAccessibleEmployeeIds(
  prisma: EmployeeDepartmentReader,
  actor: FinancePayActor,
  scope: FinancePayScope,
): Promise<AccessibleEmployeeIds> {
  if (scope === 'ALL') return 'ALL';
  if (scope === 'OWN') return [actor.id];
  const departmentIds = departmentIdsForPayAccess(actor);
  if (departmentIds.length === 0) return [actor.id];
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: departmentIds } },
    select: { employeeId: true },
  });
  return [...new Set([actor.id, ...rows.map((row) => row.employeeId)])];
}

export function employeeIsAccessible(
  employeeId: string,
  accessible: AccessibleEmployeeIds,
): boolean {
  return accessible === 'ALL' || accessible.includes(employeeId);
}

export function assertEmployeeAccessible(
  employeeId: string,
  accessible: AccessibleEmployeeIds,
): void {
  if (employeeIsAccessible(employeeId, accessible)) return;
  throw new ForbiddenException('Not allowed to access this employee compensation');
}

export function employeeIdWhere(accessible: AccessibleEmployeeIds): {
  employeeId?: string | { in: string[] };
} {
  if (accessible === 'ALL') return {};
  if (accessible.length === 1) {
    const only = accessible[0];
    return only ? { employeeId: only } : { employeeId: { in: [] } };
  }
  return { employeeId: { in: accessible } };
}

/** Persist the authenticated actor. A client-supplied foreign key is not consent. */
export function bindAuthenticatedApprover(
  actorId: string,
  requestedApprovedById: string | undefined | null,
): string {
  const supplied = requestedApprovedById?.trim();
  if (supplied && supplied !== actorId) {
    throw new BadRequestException('approvedById must match the authenticated user');
  }
  return actorId;
}
