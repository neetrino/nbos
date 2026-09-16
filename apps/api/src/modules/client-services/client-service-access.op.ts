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
 * OWN / DEPARTMENT for client services uses the same project-participation graph as Expense.
 * `ClientServiceRecord.projectId` is required, so unassigned rows should not exist. If a row
 * had no project, `{ project: … }` would exclude it for non-ALL callers (not treated as ALL).
 */
export function buildClientServiceParticipationWhere(
  scopedEmployeeIds: string[],
  dealScoped = false,
): Prisma.ClientServiceRecordWhereInput {
  if (dealScoped) {
    return {
      project: { orders: { some: { deal: buildDealParticipationWhere(scopedEmployeeIds) } } },
    };
  }
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

export async function resolveClientServiceParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
): Promise<Prisma.ClientServiceRecordWhereInput | undefined> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  return buildClientServiceParticipationWhere(scopedIds, Boolean(access.dealScopedParticipation));
}

/** Ensures the viewer may read or mutate a client service (404 when denied). */
export async function assertClientServiceAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  serviceId: string,
  access: FinanceScopedAccessContext | undefined,
): Promise<void> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return;

  const participation = await resolveClientServiceParticipationWhere(prisma, access);
  const row = await prisma.clientServiceRecord.findFirst({
    where: mergeFinanceWhere({ id: serviceId }, participation),
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Client service record not found');
  }
}

/** Same project/deal graph as client-service rows; 404 when the product is out of scope. */
export async function assertProductAccessibleForClientService(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
  access: FinanceScopedAccessContext | undefined,
): Promise<{ id: string; projectId: string }> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, projectId: true },
    });
    if (!product) throw new NotFoundException('Product was not found');
    return product;
  }

  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  const participation = buildClientServiceParticipationWhere(
    scopedIds,
    Boolean(access.dealScopedParticipation),
  );
  const product = await prisma.product.findFirst({
    where: { id: productId, project: participation.project },
    select: { id: true, projectId: true },
  });
  if (!product) throw new NotFoundException('Product was not found');
  return product;
}
