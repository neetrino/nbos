import type { Prisma, PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../../platform-access/platform-team-graph.where';
import {
  financeInvoicesBypassRowFilter,
  type FinanceInvoiceAccessContext,
} from './finance-invoice-access';

const SCOPE_DEPARTMENT = 'DEPARTMENT';

async function loadScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceInvoiceAccessContext,
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

/** Invoices reachable via project participation (direct, subscription, or order anchor). */
export function buildInvoiceProjectParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.InvoiceWhereInput {
  const projectFilter = buildProjectParticipationWhere(scopedEmployeeIds);
  return {
    OR: [
      { project: projectFilter },
      { subscription: { project: projectFilter } },
      { order: { project: projectFilter } },
    ],
  };
}

export async function resolveInvoiceParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceInvoiceAccessContext | undefined,
): Promise<Prisma.InvoiceWhereInput | undefined> {
  if (!access || financeInvoicesBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadScopedEmployeeIds(prisma, access);
  return buildInvoiceProjectParticipationWhere(scopedIds);
}

export function mergeInvoiceWhere(
  base: Prisma.InvoiceWhereInput,
  extra: Prisma.InvoiceWhereInput | undefined,
): Prisma.InvoiceWhereInput {
  if (!extra || Object.keys(extra).length === 0) return base;
  if (Object.keys(base).length === 0) return extra;
  return { AND: [base, extra] };
}
