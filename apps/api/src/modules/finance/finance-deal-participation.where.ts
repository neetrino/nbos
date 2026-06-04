import type { Prisma } from '@nbos/database';
import { buildDealParticipationWhere } from '../platform-access/platform-team-graph.where';

/**
 * Finance rows tied to deals where the viewer is seller / seller assistant (or PM on deal).
 * Used for Seller seat — not whole project finance via {@link buildProjectParticipationWhere}.
 */
export function buildInvoiceDealParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.InvoiceWhereInput {
  const dealFilter = buildDealParticipationWhere(scopedEmployeeIds);
  return {
    OR: [
      { order: { deal: dealFilter } },
      {
        subscription: {
          project: { orders: { some: { deal: dealFilter } } },
        },
      },
    ],
  };
}

export function buildSubscriptionDealParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.SubscriptionWhereInput {
  const dealFilter = buildDealParticipationWhere(scopedEmployeeIds);
  return {
    project: { orders: { some: { deal: dealFilter } } },
  };
}

export function buildExpenseDealParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.ExpenseWhereInput {
  const dealFilter = buildDealParticipationWhere(scopedEmployeeIds);
  return {
    project: { orders: { some: { deal: dealFilter } } },
  };
}
