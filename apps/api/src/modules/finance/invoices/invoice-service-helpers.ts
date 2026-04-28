import { type Prisma, PrismaClient } from '@nbos/database';
import { resolveOrderStatus } from '../finance-status.utils';

interface InvoiceStatsParams {
  dateFrom?: string;
  dateTo?: string;
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

  const [total, byStatus, totalRevenue, outstanding, overdue] = await Promise.all([
    prisma.invoice.count({ ...(createdAt ? { where: { createdAt } } : {}) }),
    prisma.invoice.groupBy({
      by: ['status'],
      ...(createdAt ? { where: { createdAt } } : {}),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID', ...(paidDate ? { paidDate } : {}) },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { not: 'PAID' }, ...(createdAt ? { createdAt } : {}) },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'DELAYED', ...(createdAt ? { createdAt } : {}) },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

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
      status: true,
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
