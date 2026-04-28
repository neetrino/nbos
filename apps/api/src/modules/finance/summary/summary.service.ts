import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { getFinanceReconciliationSummary } from './finance-reconciliation-summary';

interface FinanceSummaryParams {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class FinanceSummaryService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getDashboardSummary(params: FinanceSummaryParams = {}) {
    const [invoiceStats, subscriptionStats, recentPayments, upcomingInvoices, reconciliation] =
      await Promise.all([
        this.getInvoiceStats(params),
        this.getSubscriptionStats(params),
        this.getRecentPayments(params),
        this.getUpcomingInvoices(params),
        getFinanceReconciliationSummary(this.prisma),
      ]);

    return {
      kpis: {
        totalRevenue: invoiceStats.totalRevenue,
        outstandingAmount: invoiceStats.outstanding.amount,
        outstandingCount: invoiceStats.outstanding.count,
        overdueAmount: invoiceStats.overdue.amount,
        overdueCount: invoiceStats.overdue.count,
        monthlyRecurringRevenue: subscriptionStats.monthlyRevenue,
        activeSubscriptions: subscriptionStats.activeSubscriptions,
      },
      invoiceStatusItems: invoiceStats.byStatus,
      reconciliation,
      recentPayments,
      upcomingInvoices,
    };
  }

  private async getInvoiceStats(params: FinanceSummaryParams) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const paidDate = this.buildDateRange(params.dateFrom, params.dateTo);

    const [total, byStatus, totalRevenue, outstanding, overdue] = await Promise.all([
      this.prisma.invoice.count({
        ...(createdAt ? { where: { createdAt } } : {}),
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        ...(createdAt ? { where: { createdAt } } : {}),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          ...(paidDate ? { paidDate } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: { not: 'PAID' },
          ...(createdAt ? { createdAt } : {}),
        },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'DELAYED',
          ...(createdAt ? { createdAt } : {}),
        },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        amount: item._sum.amount,
      })),
      totalRevenue: totalRevenue._sum.amount,
      outstanding: {
        count: outstanding._count,
        amount: outstanding._sum.amount,
      },
      overdue: {
        count: overdue._count,
        amount: overdue._sum.amount,
      },
    };
  }

  private async getSubscriptionStats(params: FinanceSummaryParams) {
    const snapshotDate = params.dateTo ? new Date(params.dateTo) : new Date();

    const [monthlyRevenue, activeSubscriptions] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          startDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
        },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          startDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
        },
      }),
    ]);

    return {
      monthlyRevenue: monthlyRevenue._sum.amount,
      activeSubscriptions,
    };
  }

  private async getRecentPayments(params: FinanceSummaryParams) {
    const paymentDate = this.buildDateRange(params.dateFrom, params.dateTo);

    const payments = await this.prisma.payment.findMany({
      ...(paymentDate ? { where: { paymentDate } } : {}),
      orderBy: { paymentDate: 'desc' },
      take: 5,
      include: {
        invoice: {
          select: {
            id: true,
            code: true,
            company: { select: { id: true, name: true } },
            order: { select: { project: { select: { id: true, name: true } } } },
            subscription: { select: { project: { select: { id: true, name: true } } } },
            projectId: true,
          },
        },
      },
    });

    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      invoice: {
        id: payment.invoice.id,
        code: payment.invoice.code,
      },
      company: payment.invoice.company,
      project:
        payment.invoice.order?.project ??
        payment.invoice.subscription?.project ??
        (payment.invoice.projectId
          ? { id: payment.invoice.projectId, name: 'Unknown project' }
          : null),
    }));
  }

  private async getUpcomingInvoices(params: FinanceSummaryParams) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate: { gte: Date; lte?: Date } = { gte: today };
    if (params.dateTo) {
      dueDate.lte = new Date(params.dateTo);
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { not: 'PAID' },
        dueDate,
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      select: {
        id: true,
        code: true,
        amount: true,
        dueDate: true,
        company: { select: { id: true, name: true } },
        projectId: true,
      },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      code: invoice.code,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      company: invoice.company,
      projectId: invoice.projectId,
    }));
  }

  private buildDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
}
