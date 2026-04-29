import { Inject, Injectable } from '@nestjs/common';
import { Decimal, PrismaClient, type ExpenseCategoryEnum } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import {
  buildDateFilter,
  COMPANY_PNL_CURRENCY,
  decimalString,
  parseCompanyPnlPeriod,
  periodIsoDate,
} from './company-pnl-helpers';
import type {
  ExpensePlanVsActualCategoryRow,
  ExpensePlanVsActualQuery,
  ExpensePlanVsActualReport,
} from './expense-plan-vs-actual.types';

const PLAN_ACTUAL_NOTES = [
  'Planned amount uses current ExpensePlan rows, scoped by nextDueDate when a period is selected.',
  'Generated card amount uses Expense rows linked to ExpensePlan rows, scoped by dueDate.',
  'Paid amount uses ExpensePayment rows whose Expense is linked to an ExpensePlan, scoped by paymentDate.',
  'Historical plan occurrences before card generation require a future journal/accrual layer.',
];

@Injectable()
export class ExpensePlanVsActualService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getReport(query: ExpensePlanVsActualQuery = {}): Promise<ExpensePlanVsActualReport> {
    const period = parseCompanyPnlPeriod(query);
    const [plans, cards, payments] = await Promise.all([
      this.getPlanRows(buildDateFilter(period)),
      this.getCardRows(buildDateFilter(period)),
      this.getPaymentRows(buildDateFilter(period)),
    ]);
    const byCategory = buildCategoryRows(plans, cards, payments);
    return {
      reportId: 'expense-plan-vs-actual',
      title: 'Expense Plan vs Actual',
      currency: COMPANY_PNL_CURRENCY,
      period: {
        dateFrom: periodIsoDate(period.dateFrom),
        dateTo: periodIsoDate(period.dateTo),
        basis: 'cash',
      },
      totals: sumCategoryRows(byCategory),
      byCategory,
      notes: PLAN_ACTUAL_NOTES,
    };
  }

  private async getPlanRows(dateFilter: ReturnType<typeof buildDateFilter>) {
    return this.prisma.expensePlan.groupBy({
      by: ['category'],
      ...(dateFilter ? { where: { nextDueDate: dateFilter } } : {}),
      _count: true,
      _sum: { amount: true },
    });
  }

  private async getCardRows(dateFilter: ReturnType<typeof buildDateFilter>) {
    return this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        expensePlanId: { not: null },
        ...(dateFilter ? { dueDate: dateFilter } : {}),
      },
      _count: true,
      _sum: { amount: true },
    });
  }

  private async getPaymentRows(dateFilter: ReturnType<typeof buildDateFilter>) {
    return this.prisma.expensePayment.findMany({
      where: {
        ...(dateFilter ? { paymentDate: dateFilter } : {}),
        expense: { expensePlanId: { not: null } },
      },
      select: {
        amount: true,
        expense: { select: { category: true } },
      },
    });
  }
}

type Category = ExpenseCategoryEnum | string;

interface CategoryAccumulator {
  category: string;
  plannedAmount: Decimal;
  generatedCardAmount: Decimal;
  paidAmount: Decimal;
  planCount: number;
  cardCount: number;
  paymentCount: number;
}

function buildCategoryRows(
  plans: Array<GroupRow>,
  cards: Array<GroupRow>,
  payments: Array<{ amount: Decimal; expense: { category: Category } }>,
): ExpensePlanVsActualCategoryRow[] {
  const byCategory = new Map<string, CategoryAccumulator>();
  for (const row of plans) {
    const acc = getCategoryAccumulator(byCategory, row.category);
    acc.plannedAmount = acc.plannedAmount.plus(row._sum.amount ?? new Decimal(0));
    acc.planCount += row._count;
  }
  for (const row of cards) {
    const acc = getCategoryAccumulator(byCategory, row.category);
    acc.generatedCardAmount = acc.generatedCardAmount.plus(row._sum.amount ?? new Decimal(0));
    acc.cardCount += row._count;
  }
  for (const row of payments) {
    const acc = getCategoryAccumulator(byCategory, row.expense.category);
    acc.paidAmount = acc.paidAmount.plus(row.amount);
    acc.paymentCount += 1;
  }
  return [...byCategory.values()]
    .map(toCategoryRow)
    .sort((a, b) => a.category.localeCompare(b.category));
}

interface GroupRow {
  category: Category;
  _count: number;
  _sum: { amount: Decimal | null };
}

function getCategoryAccumulator(map: Map<string, CategoryAccumulator>, category: Category) {
  const key = String(category);
  const existing = map.get(key);
  if (existing) return existing;
  const next = {
    category: key,
    plannedAmount: new Decimal(0),
    generatedCardAmount: new Decimal(0),
    paidAmount: new Decimal(0),
    planCount: 0,
    cardCount: 0,
    paymentCount: 0,
  };
  map.set(key, next);
  return next;
}

function toCategoryRow(acc: CategoryAccumulator): ExpensePlanVsActualCategoryRow {
  return {
    category: acc.category,
    plannedAmount: decimalString(acc.plannedAmount),
    generatedCardAmount: decimalString(acc.generatedCardAmount),
    paidAmount: decimalString(acc.paidAmount),
    variancePlannedVsPaid: decimalString(acc.plannedAmount.minus(acc.paidAmount)),
    planCount: acc.planCount,
    cardCount: acc.cardCount,
    paymentCount: acc.paymentCount,
  };
}

function sumCategoryRows(rows: ExpensePlanVsActualCategoryRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      plannedAmount: acc.plannedAmount.plus(row.plannedAmount),
      generatedCardAmount: acc.generatedCardAmount.plus(row.generatedCardAmount),
      paidAmount: acc.paidAmount.plus(row.paidAmount),
      planCount: acc.planCount + row.planCount,
      cardCount: acc.cardCount + row.cardCount,
      paymentCount: acc.paymentCount + row.paymentCount,
    }),
    {
      plannedAmount: new Decimal(0),
      generatedCardAmount: new Decimal(0),
      paidAmount: new Decimal(0),
      planCount: 0,
      cardCount: 0,
      paymentCount: 0,
    },
  );
  return {
    plannedAmount: decimalString(totals.plannedAmount),
    generatedCardAmount: decimalString(totals.generatedCardAmount),
    paidAmount: decimalString(totals.paidAmount),
    variancePlannedVsPaid: decimalString(totals.plannedAmount.minus(totals.paidAmount)),
    planCount: totals.planCount,
    cardCount: totals.cardCount,
    paymentCount: totals.paymentCount,
  };
}
