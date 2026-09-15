import {
  Decimal,
  type ExpenseFrequency,
  type ExpensePlanStatusEnum,
  type ExpenseStatusEnum,
} from '@nbos/database';
import { collectPlanMonthIndexesInYear, utcMonthIndexFromDate } from './expense-plan-occurrences';
import { computeExpenseLedgerPaymentStatus } from './expense-payment-rollup';

export type ExpensePlanGridCellKind = 'NA' | 'FORECAST' | 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface ExpensePlanGridCell {
  kind: ExpensePlanGridCellKind;
  amount: number;
  expenseId: string | null;
}

export interface ExpensePlanGridExpenseInput {
  id: string;
  amount: unknown;
  dueDate: Date | null;
  status: ExpenseStatusEnum;
  expensePayments: Array<{ amount: unknown }>;
}

export interface ExpensePlanGridRowInput {
  id: string;
  name: string;
  amount: unknown;
  frequency: ExpenseFrequency;
  nextDueDate: Date | null;
  status?: ExpensePlanStatusEnum;
  project: { id: string; code: string; name: string } | null;
  expenses: ExpensePlanGridExpenseInput[];
}

export interface ExpensePlanGridRow {
  planId: string;
  planName: string;
  amount: number;
  frequency: ExpenseFrequency;
  projectLabel: string | null;
  months: ExpensePlanGridCell[];
  annualTotal: number;
}

export interface ExpensePlanGridPayload {
  year: number;
  rows: ExpensePlanGridRow[];
  monthTotals: number[];
  grandAnnualTotal: number;
}

function numericAmount(value: unknown): number {
  if (value == null) return 0;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber: unknown }).toNumber === 'function'
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function isPastCalendarMonth(year: number, monthIndex: number, now: Date): boolean {
  const ty = now.getUTCFullYear();
  const tm = now.getUTCMonth();
  return year < ty || (year === ty && monthIndex < tm);
}

function cellContributesToTotals(kind: ExpensePlanGridCellKind): boolean {
  return kind !== 'NA';
}

function resolveExpenseCellKind(expense: ExpensePlanGridExpenseInput): ExpensePlanGridCellKind {
  const total = new Decimal(numericAmount(expense.amount));
  const paidTotal = expense.expensePayments.reduce(
    (acc, p) => acc.plus(new Decimal(numericAmount(p.amount))),
    new Decimal(0),
  );
  const ledger = computeExpenseLedgerPaymentStatus(total, paidTotal);
  if (ledger === 'PAID' || expense.status === 'PAID') {
    return 'PAID';
  }
  if (ledger === 'PARTIAL') {
    return 'PARTIAL';
  }
  if (expense.status === 'OVERDUE') {
    return 'OVERDUE';
  }
  return 'OPEN';
}

function expensesGroupedByMonth(
  expenses: ExpensePlanGridExpenseInput[],
  year: number,
): Map<number, ExpensePlanGridExpenseInput[]> {
  const map = new Map<number, ExpensePlanGridExpenseInput[]>();
  for (const exp of expenses) {
    if (!exp.dueDate || exp.dueDate.getUTCFullYear() !== year) {
      continue;
    }
    const month = utcMonthIndexFromDate(exp.dueDate);
    const bucket = map.get(month);
    if (bucket) bucket.push(exp);
    else map.set(month, [exp]);
  }
  return map;
}

function resolveExpensesCellKind(expenses: ExpensePlanGridExpenseInput[]): ExpensePlanGridCellKind {
  const kinds = expenses.map(resolveExpenseCellKind);
  if (kinds.every((kind) => kind === 'PAID')) return 'PAID';
  if (kinds.some((kind) => kind === 'OVERDUE')) return 'OVERDUE';
  if (kinds.some((kind) => kind === 'PARTIAL')) return 'PARTIAL';
  return 'OPEN';
}

function buildIssuedMonthCell(expenses: ExpensePlanGridExpenseInput[]): ExpensePlanGridCell {
  const amount = expenses.reduce((sum, exp) => sum + numericAmount(exp.amount), 0);
  return {
    kind: resolveExpensesCellKind(expenses),
    amount,
    expenseId: expenses.length === 1 ? (expenses[0]?.id ?? null) : null,
  };
}

function buildMonthCell(
  plan: ExpensePlanGridRowInput,
  monthIndex: number,
  scheduled: boolean,
  expenses: ExpensePlanGridExpenseInput[] | undefined,
  now: Date,
  year: number,
): ExpensePlanGridCell {
  if (expenses && expenses.length > 0) {
    return buildIssuedMonthCell(expenses);
  }
  if (!scheduled || isPastCalendarMonth(year, monthIndex, now)) {
    return { kind: 'NA', amount: 0, expenseId: null };
  }
  return { kind: 'FORECAST', amount: numericAmount(plan.amount), expenseId: null };
}

export function buildExpensePlanGridPayload(
  plans: ExpensePlanGridRowInput[],
  year: number,
  now: Date = new Date(),
): ExpensePlanGridPayload {
  const monthTotals = Array.from({ length: 12 }, () => 0);
  let grandAnnualTotal = 0;

  const rows: ExpensePlanGridRow[] = plans.map((plan) => {
    const planAmount = numericAmount(plan.amount);
    const allowForecast = plan.status !== 'CANCELLED';
    const scheduledMonths = allowForecast
      ? collectPlanMonthIndexesInYear(year, plan.frequency, plan.nextDueDate)
      : new Set<number>();
    const byMonth = expensesGroupedByMonth(plan.expenses, year);
    const months: ExpensePlanGridCell[] = [];
    let annualTotal = 0;

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const cell = buildMonthCell(
        plan,
        monthIndex,
        scheduledMonths.has(monthIndex),
        byMonth.get(monthIndex),
        now,
        year,
      );
      months.push(cell);
      if (cellContributesToTotals(cell.kind)) {
        annualTotal += cell.amount;
        monthTotals[monthIndex] += cell.amount;
      }
    }

    grandAnnualTotal += annualTotal;
    const projectLabel = plan.project ? `${plan.project.code} — ${plan.project.name}` : null;

    return {
      planId: plan.id,
      planName: plan.name,
      amount: planAmount,
      frequency: plan.frequency,
      projectLabel,
      months,
      annualTotal,
    };
  });

  return { year, rows, monthTotals, grandAnnualTotal };
}
