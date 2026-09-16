import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProjectParticipationWhere,
} from '../platform-access/platform-team-graph.where';
import {
  financeScopedBypassRowFilter,
  loadFinanceScopedEmployeeIds,
  mergeFinanceWhere,
  type FinanceScopedAccessContext,
} from '../finance/finance-scoped-access';

/**
 * OWN / DEPARTMENT for expense plans uses the same project-participation graph as Expense.
 * Plans have no owner column. A plan with `projectId = null` does not match `{ project: … }`,
 * so non-ALL callers never see unassigned rows (not treated as ALL).
 */
export function buildExpensePlanParticipationWhere(
  scopedEmployeeIds: string[],
  dealScoped = false,
): Prisma.ExpensePlanWhereInput {
  if (dealScoped) {
    return {
      project: { orders: { some: { deal: buildDealParticipationWhere(scopedEmployeeIds) } } },
    };
  }
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

export async function resolveExpensePlanParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
): Promise<Prisma.ExpensePlanWhereInput | undefined> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  return buildExpensePlanParticipationWhere(scopedIds, Boolean(access.dealScopedParticipation));
}

/** Ensures the viewer may read or mutate an expense plan (404 when denied). */
export async function assertExpensePlanAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  planId: string,
  access: FinanceScopedAccessContext | undefined,
): Promise<void> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return;

  const participation = await resolveExpensePlanParticipationWhere(prisma, access);
  const row = await prisma.expensePlan.findFirst({
    where: mergeFinanceWhere({ id: planId }, participation),
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Expense plan not found');
  }
}
