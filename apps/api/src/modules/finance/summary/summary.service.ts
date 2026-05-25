import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { PayrollRunsService } from '../../payroll-runs/payroll-runs.service';
import {
  ACTIVE_EXPENSE_STATUSES,
  OPEN_INVOICE_MONEY_STATUSES,
  foldExpenseCards,
  foldInvoiceCards,
} from './finance-card-metrics';
import { getFinanceReconciliationSummary } from './finance-reconciliation-summary';

interface FinanceSummaryParams {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class FinanceSummaryService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly payrollRunsService: PayrollRunsService,
  ) {}

  async getDashboardSummary(params: FinanceSummaryParams = {}) {
    const [
      invoiceStats,
      expenseStats,
      subscriptionStats,
      recentPayments,
      upcomingInvoices,
      reconciliation,
      payrollRuns,
    ] = await Promise.all([
      this.getInvoiceStats(params),
      this.getExpenseCardStats(params),
      this.getSubscriptionStats(params),
      this.getRecentPayments(params),
      this.getUpcomingInvoices(params),
      getFinanceReconciliationSummary(this.prisma),
      this.payrollRunsService.getStats({}),
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
      invoiceCards: invoiceStats.invoiceCards,
      expenseCards: expenseStats,
      invoiceStatusItems: invoiceStats.byStatus,
      reconciliation,
      recentPayments,
      upcomingInvoices,
      /** Workspace-wide payroll run aggregates (not filtered by invoice `dateFrom`/`dateTo`). */
      payrollRuns,
    };
  }

  private async getInvoiceStats(params: FinanceSummaryParams) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const paymentDate = this.buildDateRange(params.dateFrom, params.dateTo);

    const [invoiceCards, total, byStatus, totalRevenue] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          ...(createdAt ? { createdAt } : {}),
        },
        select: {
          amount: true,
          dueDate: true,
          moneyStatus: true,
          payments: { select: { amount: true } },
        },
      }),
      this.prisma.invoice.count({
        ...(createdAt ? { where: { createdAt } } : {}),
      }),
      this.prisma.invoice.groupBy({
        by: ['moneyStatus'],
        ...(createdAt ? { where: { createdAt } } : {}),
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          ...(paymentDate ? { paymentDate } : {}),
        },
        _sum: { amount: true },
      }),
    ]);
    const invoiceCardSummary = foldInvoiceCards(invoiceCards);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.moneyStatus,
        count: item._count,
        amount: item._sum.amount,
      })),
      totalRevenue: totalRevenue._sum.amount,
      outstanding: invoiceCardSummary.outstanding,
      overdue: invoiceCardSummary.overdue,
      invoiceCards: invoiceCardSummary,
    };
  }

  private async getExpenseCardStats(params: FinanceSummaryParams) {
    const createdAt = this.buildDateRange(params.dateFrom, params.dateTo);
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...(createdAt ? { createdAt } : {}),
        status: { in: [...ACTIVE_EXPENSE_STATUSES, 'PAID'] },
      },
      select: {
        amount: true,
        dueDate: true,
        status: true,
        backlogReason: true,
        expensePayments: { select: { amount: true } },
      },
    });

    return foldExpenseCards(expenses);
  }

  private async getSubscriptionStats(params: FinanceSummaryParams) {
    const snapshotDate = params.dateTo ? new Date(params.dateTo) : new Date();

    const [monthlyRevenue, activeSubscriptions] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          billingStartDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
        },
        _sum: { baseMonthlyAmount: true },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          billingStartDate: { lte: snapshotDate },
          OR: [{ endDate: null }, { endDate: { gte: snapshotDate } }],
        },
      }),
    ]);

    return {
      monthlyRevenue: monthlyRevenue._sum?.baseMonthlyAmount ?? null,
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
        moneyStatus: { in: [...OPEN_INVOICE_MONEY_STATUSES] },
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
