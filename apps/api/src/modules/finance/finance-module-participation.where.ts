import type { Prisma, PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../platform-access/platform-team-graph.where';
import {
  buildExpenseDealParticipationWhere,
  buildInvoiceDealParticipationWhere,
  buildSubscriptionDealParticipationWhere,
} from './finance-deal-participation.where';
import {
  financeScopedBypassRowFilter,
  loadFinanceScopedEmployeeIds,
  type FinanceScopedAccessContext,
} from './finance-scoped-access';
import { buildInvoiceProjectParticipationWhere } from './invoices/finance-invoice-participation.where';

export function buildPaymentParticipationWhere(
  scopedEmployeeIds: string[],
  dealScoped = false,
): Prisma.PaymentWhereInput {
  const invoiceWhere = dealScoped
    ? buildInvoiceDealParticipationWhere(scopedEmployeeIds)
    : buildInvoiceProjectParticipationWhere(scopedEmployeeIds);
  return { invoice: invoiceWhere };
}

export function buildSubscriptionParticipationWhere(
  scopedEmployeeIds: string[],
  dealScoped = false,
): Prisma.SubscriptionWhereInput {
  if (dealScoped) {
    return buildSubscriptionDealParticipationWhere(scopedEmployeeIds);
  }
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

export function buildExpenseParticipationWhere(
  scopedEmployeeIds: string[],
  dealScoped = false,
): Prisma.ExpenseWhereInput {
  if (dealScoped) {
    return buildExpenseDealParticipationWhere(scopedEmployeeIds);
  }
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

async function resolveParticipation<T>(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
  build: (scopedEmployeeIds: string[], dealScoped: boolean) => T,
): Promise<T | undefined> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  return build(scopedIds, Boolean(access.dealScopedParticipation));
}

export async function resolvePaymentParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
): Promise<Prisma.PaymentWhereInput | undefined> {
  return resolveParticipation(prisma, access, buildPaymentParticipationWhere);
}

export async function resolveSubscriptionParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
): Promise<Prisma.SubscriptionWhereInput | undefined> {
  return resolveParticipation(prisma, access, buildSubscriptionParticipationWhere);
}

export async function resolveExpenseParticipationWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
): Promise<Prisma.ExpenseWhereInput | undefined> {
  return resolveParticipation(prisma, access, buildExpenseParticipationWhere);
}
