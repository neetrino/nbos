import type { PrismaClient, Prisma } from '@nbos/database';
import type { CurrentUserPayload } from '../../../common/decorators';
import {
  financeExpenseAccessFromUser,
  financePaymentAccessFromUser,
  financeSubscriptionAccessFromUser,
} from '../../finance/finance-module-access';
import { financeInvoiceAccessFromUser } from '../../finance/invoices/finance-invoice-access';
import { buildInvoiceSearchOr } from '../../finance/invoices/invoice-search.where';
import {
  mergeInvoiceWhere,
  resolveInvoiceParticipationWhere,
} from '../../finance/invoices/finance-invoice-participation.where';
import { mergeFinanceWhere } from '../../finance/finance-scoped-access';
import {
  resolveExpenseParticipationWhere,
  resolvePaymentParticipationWhere,
  resolveSubscriptionParticipationWhere,
} from '../../finance/finance-module-participation.where';
import { buildPaymentSearchWhere } from '../../finance/payments/payment-search.where';
import { buildOrderSearchOr } from '../../finance/orders/order-search.where';
import { buildSubscriptionSearchOr } from '../../finance/subscriptions/subscription-search.where';
import { buildExpenseSearchAnd } from '../../expenses/expense-search.where';
import {
  buildExpenseSearchHref,
  buildInvoiceSearchHref,
  buildOrderSearchHref,
  buildPaymentSearchHref,
  buildSubscriptionSearchHref,
} from '../search-href';
import type { FinanceSearchSubtype, SearchHit } from '../search.types';
import { resolveAllowedFinanceSubtypes } from '../search-permissions';

function sortHitsByRecency(items: SearchHit[]): SearchHit[] {
  return [...items].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

async function searchInvoices(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const access = financeInvoiceAccessFromUser(user);
  const projectMatches = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
    take: 50,
  });
  const matchedProjectIds = projectMatches.map((p) => p.id);
  const baseWhere = { AND: [buildInvoiceSearchOr(query, matchedProjectIds)] };
  const participationWhere = await resolveInvoiceParticipationWhere(prisma, access);
  const where = mergeInvoiceWhere(baseWhere, participationWhere);

  const rows = await prisma.invoice.findMany({
    where,
    select: {
      id: true,
      code: true,
      updatedAt: true,
      createdAt: true,
      company: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'finance',
    entityType: 'invoice',
    title: row.code,
    subtitle: row.company?.name?.trim() ? `Invoice · ${row.company.name}` : 'Invoice',
    href: buildInvoiceSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}

async function searchPayments(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const access = financePaymentAccessFromUser(user);
  const baseWhere = buildPaymentSearchWhere(query);
  const participationWhere = await resolvePaymentParticipationWhere(prisma, access);
  const where = mergeFinanceWhere(baseWhere, participationWhere);

  const rows = await prisma.payment.findMany({
    where,
    select: {
      id: true,
      notes: true,
      paymentDate: true,
      updatedAt: true,
      createdAt: true,
      invoice: { select: { code: true, company: { select: { name: true } } } },
    },
    orderBy: { paymentDate: 'desc' },
    take: limit,
  });

  return rows.map((row) => {
    const invoiceCode = row.invoice?.code?.trim();
    const title = invoiceCode || row.notes?.trim() || 'Payment';
    const company = row.invoice?.company?.name?.trim();
    return {
      id: row.id,
      group: 'finance',
      entityType: 'payment',
      title,
      subtitle: company ? `Payment · ${company}` : 'Payment',
      href: buildPaymentSearchHref(),
      occurredAt: row.paymentDate.toISOString(),
    };
  });
}

async function searchOrders(
  prisma: InstanceType<typeof PrismaClient>,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const rows = await prisma.order.findMany({
    where: { OR: buildOrderSearchOr(query) },
    select: {
      id: true,
      code: true,
      updatedAt: true,
      createdAt: true,
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'finance',
    entityType: 'order',
    title: row.code,
    subtitle: row.project?.name?.trim() ? `Order · ${row.project.name}` : 'Order',
    href: buildOrderSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}

async function searchSubscriptions(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const access = financeSubscriptionAccessFromUser(user);
  const baseWhere: Prisma.SubscriptionWhereInput = { OR: buildSubscriptionSearchOr(query) };
  const participationWhere = await resolveSubscriptionParticipationWhere(prisma, access);
  const where = mergeFinanceWhere(baseWhere, participationWhere);

  const rows = await prisma.subscription.findMany({
    where,
    select: {
      id: true,
      code: true,
      name: true,
      updatedAt: true,
      createdAt: true,
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'finance',
    entityType: 'subscription',
    title: row.name?.trim() || row.code,
    subtitle: row.project?.name?.trim() ? `Subscription · ${row.project.name}` : 'Subscription',
    href: buildSubscriptionSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}

async function searchExpenses(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const access = financeExpenseAccessFromUser(user);
  const baseWhere: Prisma.ExpenseWhereInput = { AND: [buildExpenseSearchAnd(query)] };
  const participationWhere = await resolveExpenseParticipationWhere(prisma, access);
  const where = mergeFinanceWhere(baseWhere, participationWhere);

  const rows = await prisma.expense.findMany({
    where,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      createdAt: true,
      project: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    group: 'finance',
    entityType: 'expense',
    title: row.name,
    subtitle: row.project?.name?.trim() ? `Expense · ${row.project.name}` : 'Expense',
    href: buildExpenseSearchHref(row.id),
    occurredAt: (row.updatedAt ?? row.createdAt).toISOString(),
  }));
}

async function runFinanceSubtypeSearch(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  subtype: FinanceSearchSubtype,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  switch (subtype) {
    case 'invoice':
      return searchInvoices(prisma, user, query, limit);
    case 'payment':
      return searchPayments(prisma, user, query, limit);
    case 'order':
      return searchOrders(prisma, query, limit);
    case 'subscription':
      return searchSubscriptions(prisma, user, query, limit);
    case 'expense':
      return searchExpenses(prisma, user, query, limit);
    default:
      return [];
  }
}

/** Runs permitted finance entity searchers and merges by recency. */
export async function searchFinance(
  prisma: InstanceType<typeof PrismaClient>,
  user: CurrentUserPayload,
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const subtypes = resolveAllowedFinanceSubtypes(user.permissions);
  if (subtypes.length === 0) return [];

  const perSubtypeLimit = Math.max(limit, 5);
  const results = await Promise.all(
    subtypes.map((subtype) =>
      runFinanceSubtypeSearch(prisma, user, subtype, query, perSubtypeLimit),
    ),
  );

  return sortHitsByRecency(results.flat()).slice(0, limit);
}
