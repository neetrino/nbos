import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

@Injectable()
export class FinanceSummaryService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getDashboardSummary() {
    const [invoiceStats, subscriptionStats, recentPayments, upcomingInvoices] = await Promise.all([
      this.getInvoiceStats(),
      this.getSubscriptionStats(),
      this.getRecentPayments(),
      this.getUpcomingInvoices(),
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
      recentPayments,
      upcomingInvoices,
    };
  }

  private async getInvoiceStats() {
    const [total, byStatus, totalRevenue, outstanding, overdue] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: { not: 'PAID' } },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'DELAYED' },
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

  private async getSubscriptionStats() {
    const [monthlyRevenue, activeSubscriptions] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      monthlyRevenue: monthlyRevenue._sum.amount,
      activeSubscriptions,
    };
  }

  private async getRecentPayments() {
    const payments = await this.prisma.payment.findMany({
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

  private async getUpcomingInvoices() {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: { not: 'PAID' },
        dueDate: { not: null },
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
}
