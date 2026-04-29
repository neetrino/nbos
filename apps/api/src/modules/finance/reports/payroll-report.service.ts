import { Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildDateFilter,
  buildPayrollMonthFilter,
  COMPANY_PNL_CURRENCY,
  decimalString,
  marginPercent,
  parseCompanyPnlPeriod,
  periodIsoDate,
} from './company-pnl-helpers';
import type { PayrollReport, PayrollReportQuery } from './payroll-report.types';

const PAYROLL_REPORT_NOTES = [
  'Payroll totals use PayrollRun aggregate fields in the selected payrollMonth scope.',
  'Salary expense paid uses ExpensePayment rows linked through SalaryLine expense cards.',
  'Payroll as % of revenue uses totalPayable divided by incoming payments for the selected period.',
  'Department comparisons and scheduled payroll packets remain Phase 6/reporting work.',
];

@Injectable()
export class PayrollReportService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: PayrollReportQuery = {}): Promise<PayrollReport> {
    const period = parseCompanyPnlPeriod(query);
    const payrollMonth = buildPayrollMonthFilter(period);
    const payrollWhere = payrollMonth ? { payrollMonth } : {};
    const dateFilter = buildDateFilter(period);

    const [runs, salaryLineCount, salaryExpensePaid, revenue] = await Promise.all([
      this.getRunStats(payrollWhere),
      this.getSalaryLineCount(payrollWhere),
      this.getSalaryExpensePaid(dateFilter, payrollWhere),
      this.getRevenueControl(dateFilter),
    ]);

    return {
      reportId: 'payroll-report',
      title: 'Payroll Report',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        basis: 'cash',
      },
      totals: {
        ...runs.totals,
        salaryLineCount,
        salaryExpensePaid: decimalString(salaryExpensePaid.total),
        payrollAsPercentOfRevenue: marginPercent(runs.totalPayableDecimal, revenue.total),
      },
      byStatus: runs.byStatus,
      revenueControl: {
        incomingPayments: decimalString(revenue.total),
        paymentCount: revenue.count,
      },
      notes: PAYROLL_REPORT_NOTES,
    };
  }

  private async getRunStats(where: Prisma.PayrollRunWhereInput) {
    const [payrollRunCount, sums, byStatus] = await Promise.all([
      this.prisma.payrollRun.count({ where }),
      this.prisma.payrollRun.aggregate({
        where,
        _sum: {
          totalBaseSalary: true,
          totalBonuses: true,
          totalAdjustments: true,
          totalDeductions: true,
          totalPayable: true,
          totalPaid: true,
        },
      }),
      this.prisma.payrollRun.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { totalPayable: true, totalPaid: true },
      }),
    ]);
    const totalPayable = sums._sum.totalPayable ?? new Decimal(0);
    const totalPaid = sums._sum.totalPaid ?? new Decimal(0);
    return {
      totalPayableDecimal: totalPayable,
      totals: {
        payrollRunCount,
        totalBaseSalary: decimalString(sums._sum.totalBaseSalary),
        totalBonuses: decimalString(sums._sum.totalBonuses),
        totalAdjustments: decimalString(sums._sum.totalAdjustments),
        totalDeductions: decimalString(sums._sum.totalDeductions),
        totalPayable: decimalString(totalPayable),
        totalPaid: decimalString(totalPaid),
        totalRemaining: decimalString(totalPayable.minus(totalPaid)),
      },
      byStatus: byStatus.map((row) => {
        const payable = row._sum.totalPayable ?? new Decimal(0);
        const paid = row._sum.totalPaid ?? new Decimal(0);
        return {
          status: String(row.status),
          runCount: row._count,
          totalPayable: decimalString(payable),
          totalPaid: decimalString(paid),
          totalRemaining: decimalString(payable.minus(paid)),
        };
      }),
    };
  }

  private getSalaryLineCount(payrollRun: Prisma.PayrollRunWhereInput) {
    return this.prisma.salaryLine.count({ where: { payrollRun } });
  }

  private async getSalaryExpensePaid(
    paymentDate: ReturnType<typeof buildDateFilter>,
    payrollRun: Prisma.PayrollRunWhereInput,
  ) {
    const where = {
      ...(paymentDate ? { paymentDate } : {}),
      expense: { salaryLine: { payrollRun } },
    };
    const [count, aggregate] = await Promise.all([
      this.prisma.expensePayment.count({ where }),
      this.prisma.expensePayment.aggregate({ where, _sum: { amount: true } }),
    ]);
    return { count, total: aggregate._sum.amount ?? new Decimal(0) };
  }

  private async getRevenueControl(paymentDate: ReturnType<typeof buildDateFilter>) {
    const where = paymentDate ? { paymentDate } : {};
    const [count, aggregate] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);
    return { count, total: aggregate._sum.amount ?? new Decimal(0) };
  }
}
