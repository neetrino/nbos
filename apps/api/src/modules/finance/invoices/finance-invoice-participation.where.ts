import type { Prisma, PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../../platform-access/platform-team-graph.where';
import {
  financeScopedBypassRowFilter,
  loadFinanceScopedEmployeeIds,
  mergeFinanceWhere,
  type FinanceScopedAccessContext,
} from '../finance-scoped-access';
import type { FinanceInvoiceAccessContext } from './finance-invoice-access';

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
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  return buildInvoiceProjectParticipationWhere(scopedIds);
}

export const mergeInvoiceWhere = mergeFinanceWhere<Prisma.InvoiceWhereInput>;
