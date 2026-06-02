import { type Prisma, PrismaClient } from '@nbos/database';
import { resolveOrderStatus } from '../finance-status.utils';
import type { FinanceInvoiceAccessContext } from './finance-invoice-access';
import {
  mergeInvoiceWhere,
  resolveInvoiceParticipationWhere,
} from './finance-invoice-participation.where';

interface InvoiceStatsParams {
  dateFrom?: string;
  dateTo?: string;
  /** Align KPI aggregates with `GET /finance/invoices?subscriptionId=` drill-down. */
  subscriptionId?: string;
  access?: FinanceInvoiceAccessContext;
}

interface CreateInvoiceTaxStatusInput {
  orderId?: string;
  subscriptionId?: string;
  companyId?: string;
}

export async function getInvoiceStats(
  prisma: InstanceType<typeof PrismaClient>,
  params: InvoiceStatsParams = {},
) {
  const createdAt = buildDateRange(params.dateFrom, params.dateTo);
  const paidDate = buildDateRange(params.dateFrom, params.dateTo);
  const subscriptionId = params.subscriptionId?.trim();
  const sub = subscriptionId ? { subscriptionId } : {};

  const whereCreated: Prisma.InvoiceWhereInput = {
    ...sub,
    ...(createdAt ? { createdAt } : {}),
  };
  const participationWhere = await resolveInvoiceParticipationWhere(prisma, params.access);
  const scopedWhere = mergeInvoiceWhere(whereCreated, participationWhere);
  const hasScopedWhere = Object.keys(scopedWhere).length > 0;

  const [total, byMoney, totalRevenue, outstanding, overdue] = await Promise.all([
    hasScopedWhere ? prisma.invoice.count({ where: scopedWhere }) : prisma.invoice.count(),
    prisma.invoice.groupBy({
      by: ['moneyStatus'],
      ...(hasScopedWhere ? { where: scopedWhere } : {}),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: mergeInvoiceWhere(
        { moneyStatus: 'PAID', ...sub, ...(paidDate ? { paidDate } : {}) },
        participationWhere,
      ),
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: mergeInvoiceWhere(
        { moneyStatus: { not: 'PAID' }, ...sub, ...(createdAt ? { createdAt } : {}) },
        participationWhere,
      ),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: mergeInvoiceWhere(
        { moneyStatus: 'OVERDUE', ...sub, ...(createdAt ? { createdAt } : {}) },
        participationWhere,
      ),
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  const byStatus = byMoney.map((row) => ({
    status: row.moneyStatus,
    _count: row._count,
    _sum: row._sum,
  }));

  return {
    total,
    byStatus,
    totalRevenue: totalRevenue._sum.amount,
    outstanding: { count: outstanding._count, amount: outstanding._sum.amount },
    overdue: { count: overdue._count, amount: overdue._sum.amount },
  };
}

export async function syncInvoiceOrderStatus(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
) {
  const invoices = await prisma.invoice.findMany({
    where: { orderId },
    select: {
      moneyStatus: true,
      payments: { select: { amount: true } },
    },
  });
  if (invoices.length === 0) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: resolveOrderStatus(invoices) },
  });
}

export async function resolveInvoiceTaxStatus(
  prisma: InstanceType<typeof PrismaClient>,
  data: CreateInvoiceTaxStatusInput,
): Promise<Prisma.InvoiceCreateInput['taxStatus']> {
  return (
    (await resolveOrderTaxStatus(prisma, data.orderId)) ??
    (await resolveSubscriptionTaxStatus(prisma, data.subscriptionId)) ??
    (await resolveCompanyTaxStatus(prisma, data.companyId)) ??
    'TAX'
  );
}

export function buildDateRange(
  dateFrom?: string,
  dateTo?: string,
): Prisma.DateTimeFilter | undefined {
  if (!dateFrom && !dateTo) return undefined;
  return {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(dateTo) } : {}),
  };
}

async function resolveOrderTaxStatus(prisma: InstanceType<typeof PrismaClient>, orderId?: string) {
  if (!orderId) return undefined;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { taxStatus: true },
  });
  return order?.taxStatus as Prisma.InvoiceCreateInput['taxStatus'] | undefined;
}

async function resolveSubscriptionTaxStatus(
  prisma: InstanceType<typeof PrismaClient>,
  subscriptionId?: string,
) {
  if (!subscriptionId) return undefined;
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { taxStatus: true },
  });
  return subscription?.taxStatus as Prisma.InvoiceCreateInput['taxStatus'] | undefined;
}

async function resolveCompanyTaxStatus(
  prisma: InstanceType<typeof PrismaClient>,
  companyId?: string,
) {
  if (!companyId) return undefined;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { taxStatus: true },
  });
  return company?.taxStatus as Prisma.InvoiceCreateInput['taxStatus'] | undefined;
}
