import type { Prisma, PrismaClient } from '@nbos/database';
import { buildProjectParticipationWhere } from '../platform-access/platform-team-graph.where';
import {
  financeScopedBypassRowFilter,
  loadFinanceScopedEmployeeIds,
  type FinanceScopedAccessContext,
} from './finance-scoped-access';
import { buildInvoiceProjectParticipationWhere } from './invoices/finance-invoice-participation.where';

export function buildPaymentParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.PaymentWhereInput {
  return { invoice: buildInvoiceProjectParticipationWhere(scopedEmployeeIds) };
}

export function buildSubscriptionParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.SubscriptionWhereInput {
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

export function buildExpenseParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.ExpenseWhereInput {
  return { project: buildProjectParticipationWhere(scopedEmployeeIds) };
}

async function resolveParticipation<T>(
  prisma: InstanceType<typeof PrismaClient>,
  access: FinanceScopedAccessContext | undefined,
  build: (scopedEmployeeIds: string[]) => T,
): Promise<T | undefined> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return undefined;
  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  return build(scopedIds);
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
