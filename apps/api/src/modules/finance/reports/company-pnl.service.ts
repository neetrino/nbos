import { Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
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
import type { CompanyPnlQuery, CompanyPnlReport } from './company-pnl.types';

const COMPANY_PNL_NOTES = [
  'Revenue uses actual incoming Payment rows in the selected paymentDate period.',
  'Costs use actual ExpensePayment rows in the selected paymentDate period.',
  'Payroll control is reported separately to avoid double-counting materialized salary expenses.',
];

@Injectable()
export class CompanyPnlService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: CompanyPnlQuery = {}): Promise<CompanyPnlReport> {
    const period = parseCompanyPnlPeriod(query);
    const dateFilter = buildDateFilter(period);
    const [revenue, expensePayments, payrollControl] = await Promise.all([
      this.getRevenue(dateFilter),
      this.getExpensePayments(dateFilter),
      this.getPayrollControl(buildPayrollMonthFilter(period)),
    ]);

    const grossProfit = revenue.total.minus(expensePayments.total);
    return {
      reportId: 'company-pnl',
      title: 'Company P&L',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        basis: 'cash',
      },
      revenue: {
        incomingPayments: decimalString(revenue.total),
        paymentCount: revenue.count,
      },
      costs: {
        actualExpensePayments: decimalString(expensePayments.total),
        payrollExpensePayments: decimalString(expensePayments.payroll),
        nonPayrollExpensePayments: decimalString(expensePayments.nonPayroll),
        expensePaymentCount: expensePayments.count,
      },
      payrollControl,
      profitability: {
        grossProfit: decimalString(grossProfit),
        netProfit: decimalString(grossProfit),
        marginPercent: marginPercent(grossProfit, revenue.total),
      },
      notes: COMPANY_PNL_NOTES,
    };
  }

  private async getRevenue(paymentDate: ReturnType<typeof buildDateFilter>) {
    const where = paymentDate ? { paymentDate } : {};
    const [count, aggregate] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);
    return { count, total: aggregate._sum.amount ?? new Decimal(0) };
  }

  private async getExpensePayments(paymentDate: ReturnType<typeof buildDateFilter>) {
    const rows = await this.prisma.expensePayment.findMany({
      ...(paymentDate ? { where: { paymentDate } } : {}),
      select: {
        amount: true,
        expense: { select: { salaryLine: { select: { id: true } } } },
      },
    });
    return summarizeExpensePayments(rows);
  }

  private async getPayrollControl(payrollMonth: ReturnType<typeof buildPayrollMonthFilter>) {
    const where = payrollMonth ? { payrollMonth } : {};
    const [payrollRunCount, aggregate] = await Promise.all([
      this.prisma.payrollRun.count({ where }),
      this.prisma.payrollRun.aggregate({
        where,
        _sum: { totalPaid: true, totalPayable: true },
      }),
    ]);
    return {
      payrollRunCount,
      payrollRunPaid: decimalString(aggregate._sum.totalPaid),
      payrollRunPayable: decimalString(aggregate._sum.totalPayable),
    };
  }
}

function summarizeExpensePayments(
  rows: Array<{ amount: Decimal; expense: { salaryLine: { id: string } | null } }>,
) {
  return rows.reduce(
    (acc, row) => {
      const amount = row.amount ?? new Decimal(0);
      acc.total = acc.total.plus(amount);
      acc.count += 1;
      if (row.expense.salaryLine) acc.payroll = acc.payroll.plus(amount);
      else acc.nonPayroll = acc.nonPayroll.plus(amount);
      return acc;
    },
    { total: new Decimal(0), payroll: new Decimal(0), nonPayroll: new Decimal(0), count: 0 },
  );
}
