import { Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildDateFilter,
  buildPayrollMonthFilter,
  COMPANY_PNL_CURRENCY,
  decimalString,
  parseCompanyPnlPeriod,
  periodIsoDate,
} from './company-pnl-helpers';
import type { CashFlowForecastBucket, CashFlowQuery, CashFlowReport } from './cash-flow.types';

const CASH_FLOW_HORIZONS = [30, 60, 90] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const CASH_FLOW_NOTES = [
  'Actuals use Payment and ExpensePayment rows in the selected paymentDate period.',
  'Forecast uses open invoice cards, unpaid expense cards, due expense plans and payroll run remaining amounts.',
  'Backlog debt is reported separately and is not mixed into the current cash forecast.',
  'Current bank balance is deferred until bank integration or approved manual balance entry exists.',
];

@Injectable()
export class CashFlowService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: CashFlowQuery = {}): Promise<CashFlowReport> {
    const period = parseCompanyPnlPeriod(query);
    const asOf = query.asOf
      ? (parseCompanyPnlPeriod({ dateFrom: query.asOf }).dateFrom ?? new Date())
      : new Date();
    asOf.setHours(0, 0, 0, 0);
    const maxDate = addDays(asOf, CASH_FLOW_HORIZONS[CASH_FLOW_HORIZONS.length - 1]);
    const dateFilter = buildDateFilter(period);

    const [actuals, incoming, cards, plans, payroll, backlogDebt] = await Promise.all([
      this.getActuals(dateFilter),
      this.getExpectedIncoming(asOf, maxDate),
      this.getExpectedExpenseCards(asOf, maxDate),
      this.getExpectedExpensePlans(asOf, maxDate),
      this.getExpectedPayroll(asOf, maxDate),
      this.getBacklogDebt(),
    ]);

    const forecast = buildForecastBuckets(asOf, { incoming, cards, plans, payroll });
    return {
      reportId: 'cash-flow',
      title: 'Cash Flow',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        basis: 'cash',
        asOf: periodIsoDate(asOf) ?? new Date().toISOString().slice(0, 10),
      },
      actuals,
      forecast,
      backlogDebt,
      notes: CASH_FLOW_NOTES,
    };
  }

  private async getActuals(paymentDate: ReturnType<typeof buildDateFilter>) {
    const where = paymentDate ? { paymentDate } : {};
    const [paymentCount, payments, expensePaymentCount, expensePayments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
      this.prisma.expensePayment.count({ where }),
      this.prisma.expensePayment.aggregate({ where, _sum: { amount: true } }),
    ]);
    const realIncoming = payments._sum.amount ?? new Decimal(0);
    const realOutgoing = expensePayments._sum.amount ?? new Decimal(0);
    return {
      realIncoming: decimalString(realIncoming),
      realOutgoing: decimalString(realOutgoing),
      netMovement: decimalString(realIncoming.minus(realOutgoing)),
      paymentCount,
      expensePaymentCount,
    };
  }

  private async getExpectedIncoming(asOf: Date, maxDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: { moneyStatus: { not: 'PAID' }, dueDate: { gte: asOf, lte: maxDate } },
      select: { amount: true, dueDate: true, payments: { select: { amount: true } } },
    });
    return invoices.map((row) => ({
      date: row.dueDate ?? maxDate,
      amount: outstandingAmount(row.amount, row.payments),
    }));
  }

  private async getExpectedExpenseCards(asOf: Date, maxDate: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: { notIn: ['PAID', 'DELAYED'] },
        backlogReason: null,
        dueDate: { gte: asOf, lte: maxDate },
      },
      select: { amount: true, dueDate: true, expensePayments: { select: { amount: true } } },
    });
    return expenses.map((row) => ({
      date: row.dueDate ?? maxDate,
      amount: outstandingAmount(row.amount, row.expensePayments),
    }));
  }

  private async getExpectedExpensePlans(asOf: Date, maxDate: Date) {
    const plans = await this.prisma.expensePlan.findMany({
      where: { nextDueDate: { gte: asOf, lte: maxDate } },
      select: { amount: true, nextDueDate: true },
    });
    return plans.map((row) => ({ date: row.nextDueDate ?? maxDate, amount: row.amount }));
  }

  private async getExpectedPayroll(asOf: Date, maxDate: Date) {
    const payrollMonth = buildPayrollMonthFilter({ dateFrom: asOf, dateTo: maxDate });
    const runs = await this.prisma.payrollRun.findMany({
      where: { ...(payrollMonth ? { payrollMonth } : {}), status: { not: 'CLOSED' } },
      select: { payrollMonth: true, totalPayable: true, totalPaid: true },
    });
    return runs.map((row) => ({
      date: payrollMonthEnd(row.payrollMonth),
      amount: row.totalPayable.minus(row.totalPaid),
    }));
  }

  private async getBacklogDebt() {
    const rows = await this.prisma.expense.findMany({
      where: { OR: [{ status: 'DELAYED' }, { backlogReason: { not: null } }] },
      select: { amount: true, expensePayments: { select: { amount: true } } },
    });
    const amount = rows.reduce(
      (sum, row) => sum.plus(outstandingAmount(row.amount, row.expensePayments)),
      new Decimal(0),
    );
    return { amount: decimalString(amount), expenseCount: rows.length };
  }
}

function buildForecastBuckets(
  asOf: Date,
  items: {
    incoming: CashFlowItem[];
    cards: CashFlowItem[];
    plans: CashFlowItem[];
    payroll: CashFlowItem[];
  },
) {
  const allOutgoing = [...items.cards, ...items.plans, ...items.payroll];
  const buckets: CashFlowForecastBucket[] = CASH_FLOW_HORIZONS.map((horizonDays) => {
    const cutoff = addDays(asOf, horizonDays);
    const expectedIncoming = sumUntil(items.incoming, cutoff);
    const expectedOutgoing = sumUntil(allOutgoing, cutoff);
    return {
      horizonDays,
      expectedIncoming: decimalString(expectedIncoming),
      expectedOutgoing: decimalString(expectedOutgoing),
      netExpected: decimalString(expectedIncoming.minus(expectedOutgoing)),
    };
  });
  return {
    expectedIncomingOpenInvoices: decimalString(sumUntil(items.incoming, addDays(asOf, 90))),
    expectedOutgoingExpenseCards: decimalString(sumUntil(items.cards, addDays(asOf, 90))),
    expectedOutgoingExpensePlans: decimalString(sumUntil(items.plans, addDays(asOf, 90))),
    expectedOutgoingPayroll: decimalString(sumUntil(items.payroll, addDays(asOf, 90))),
    buckets,
  };
}

interface CashFlowItem {
  date: Date;
  amount: Decimal;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime() + days * DAY_MS);
  result.setHours(23, 59, 59, 999);
  return result;
}

function outstandingAmount(amount: Decimal, payments: Array<{ amount: Decimal }>): Decimal {
  const remaining = amount.minus(
    payments.reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0)),
  );
  return remaining.isNegative() ? new Decimal(0) : remaining;
}

function payrollMonthEnd(month: string): Date {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0, 23, 59, 59, 999);
}

function sumUntil(items: CashFlowItem[], cutoff: Date): Decimal {
  return items.reduce(
    (sum, item) => (item.date <= cutoff ? sum.plus(item.amount) : sum),
    new Decimal(0),
  );
}
