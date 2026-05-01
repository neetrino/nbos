import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildDateFilter,
  COMPANY_PNL_CURRENCY,
  decimalString,
  parseCompanyPnlPeriod,
  periodIsoDate,
} from './company-pnl-helpers';
import type {
  MrrSubscriptionRevenueQuery,
  MrrSubscriptionRevenueReport,
} from './mrr-subscription-revenue.types';

const MRR_NOTES = [
  'Active MRR uses active Subscription.amount at the snapshot date.',
  'Paid subscription revenue uses Payment rows linked to subscription invoice cards.',
  'New and churned MRR use subscription startDate/endDate in the selected period.',
  'Invoice coverage_start_month / coverage_month_count is not yet in runtime schema, so monthly paid coverage is deferred.',
];

@Injectable()
export class MrrSubscriptionRevenueService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: MrrSubscriptionRevenueQuery = {}): Promise<MrrSubscriptionRevenueReport> {
    const period = parseCompanyPnlPeriod(query);
    const dateFilter = buildDateFilter(period);
    const snapshotDate = period.dateTo ?? new Date();
    const [active, movement, paidRevenue] = await Promise.all([
      this.getActive(snapshotDate),
      this.getMovement(dateFilter),
      this.getPaidRevenue(dateFilter),
    ]);

    return {
      reportId: 'mrr-subscription-revenue',
      title: 'MRR / Subscription Revenue',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        snapshotDate: periodIsoDate(snapshotDate) ?? new Date().toISOString().slice(0, 10),
        basis: 'cash',
      },
      active,
      movement,
      paidRevenue,
      notes: MRR_NOTES,
    };
  }

  private async getActive(snapshotDate: Date) {
    const where = activeSubscriptionWhere(snapshotDate);
    const [activeSubscriptionCount, total, byType] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.aggregate({ where, _sum: { amount: true } }),
      this.prisma.subscription.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);
    return {
      activeMrr: decimalString(total._sum.amount),
      activeSubscriptionCount,
      byType: byType
        .map((row) => ({
          type: String(row.type),
          activeSubscriptionCount: row._count,
          activeMrr: decimalString(row._sum.amount),
        }))
        .sort((a, b) => a.type.localeCompare(b.type)),
    };
  }

  private async getMovement(dateFilter: ReturnType<typeof buildDateFilter>) {
    const [newRows, churnedRows] = await Promise.all([
      this.prisma.subscription.aggregate({
        ...(dateFilter ? { where: { startDate: dateFilter } } : {}),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.subscription.aggregate({
        where: {
          status: { in: ['CANCELLED', 'COMPLETED'] },
          ...(dateFilter ? { endDate: dateFilter } : { endDate: { not: null } }),
        },
        _count: true,
        _sum: { amount: true },
      }),
    ]);
    return {
      newMrr: decimalString(newRows._sum.amount),
      newSubscriptionCount: newRows._count,
      churnedMrr: decimalString(churnedRows._sum.amount),
      churnedSubscriptionCount: churnedRows._count,
    };
  }

  private async getPaidRevenue(dateFilter: ReturnType<typeof buildDateFilter>) {
    const paymentWhere = {
      ...(dateFilter ? { paymentDate: dateFilter } : {}),
      invoice: { subscriptionId: { not: null } },
    };
    const invoiceWhere = {
      subscriptionId: { not: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    };
    const [paymentCount, payments, invoiceCount, invoices] = await Promise.all([
      this.prisma.payment.count({ where: paymentWhere }),
      this.prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      this.prisma.invoice.count({ where: invoiceWhere }),
      this.prisma.invoice.aggregate({ where: invoiceWhere, _sum: { amount: true } }),
    ]);
    return {
      paidSubscriptionRevenue: decimalString(payments._sum.amount),
      paymentCount,
      invoicedSubscriptionAmount: decimalString(invoices._sum.amount),
      invoiceCount,
    };
  }
}

function activeSubscriptionWhere(snapshotDate: Date) {
  return {
    status: 'ACTIVE' as const,
    startDate: { lte: snapshotDate },
    OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
  };
}
