import { expandCoverageMonthKeys, isValidCoverageMonthKey } from './subscription-coverage-month';

export type SubscriptionGridCellKind =
  | 'NA'
  | 'SUBSCRIPTION_PENDING'
  | 'PAID'
  | 'PENDING_INVOICE'
  | 'OVERDUE_INVOICE'
  | 'FORECAST'
  | 'MISSED';

export interface SubscriptionGridCell {
  kind: SubscriptionGridCellKind;
  invoiceId: string | null;
}

export interface SubscriptionGridInvoiceInput {
  id: string;
  type: string;
  amount: unknown;
  dueDate: Date | null;
  coverageStartMonth: string | null;
  coverageMonthCount: number | null;
  createdAt: Date;
  payments: { amount: unknown }[];
}

export interface SubscriptionGridRowInput {
  id: string;
  type: string;
  status: string;
  baseMonthlyAmount: unknown;
  billingStartDate: Date;
  endDate: Date | null;
  project: { id: string; name: string };
  invoices: SubscriptionGridInvoiceInput[];
}

export interface SubscriptionGridRow {
  subscriptionId: string;
  projectId: string;
  projectName: string;
  subscriptionType: string;
  amountMonthly: number;
  subscriptionStatus: string;
  months: SubscriptionGridCell[];
  /** Sum of `amountMonthly` across months that contribute to MRR-style totals. */
  annualTotal: number;
}

export interface SubscriptionGridPayload {
  year: number;
  rows: SubscriptionGridRow[];
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

function invoiceFullyPaid(inv: SubscriptionGridInvoiceInput): boolean {
  const amount = numericAmount(inv.amount);
  const paid = inv.payments.reduce((s, p) => s + numericAmount(p.amount), 0);
  return paid >= amount;
}

function invoiceOverdue(inv: SubscriptionGridInvoiceInput, now: Date): boolean {
  if (invoiceFullyPaid(inv) || !inv.dueDate) return false;
  return inv.dueDate.getTime() < now.getTime();
}

function subscriptionOverlapsMonth(
  billingStartDate: Date,
  endDate: Date | null,
  year: number,
  monthIndex: number,
): boolean {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  if (billingStartDate > last) return false;
  if (endDate !== null && endDate < first) return false;
  return true;
}

function isPastCalendarMonth(year: number, monthIndex: number, now: Date): boolean {
  const ty = now.getFullYear();
  const tm = now.getMonth();
  return year < ty || (year === ty && monthIndex < tm);
}

function invoicesCoveringMonth(
  invoices: SubscriptionGridInvoiceInput[],
  year: number,
  monthIndex: number,
): SubscriptionGridInvoiceInput[] {
  const want = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const result: SubscriptionGridInvoiceInput[] = [];
  for (const inv of invoices) {
    if (inv.type !== 'SUBSCRIPTION') continue;
    const start = inv.coverageStartMonth;
    const count = inv.coverageMonthCount ?? 1;
    if (!start || !isValidCoverageMonthKey(start) || count < 1) continue;
    const keys = expandCoverageMonthKeys(start, count);
    if (keys.includes(want)) {
      result.push(inv);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function resolveInvoiceCell(
  covering: SubscriptionGridInvoiceInput[],
  now: Date,
): { kind: SubscriptionGridCellKind; invoiceId: string | null } {
  if (covering.length === 0) {
    return { kind: 'NA', invoiceId: null };
  }

  const overdue = covering.filter((i) => invoiceOverdue(i, now));
  if (overdue.length > 0) {
    return { kind: 'OVERDUE_INVOICE', invoiceId: overdue[0].id };
  }

  const unpaid = covering.filter((i) => !invoiceFullyPaid(i));
  if (unpaid.length > 0) {
    return { kind: 'PENDING_INVOICE', invoiceId: unpaid[0].id };
  }

  return { kind: 'PAID', invoiceId: covering[0].id };
}

function cellContributesToTotals(kind: SubscriptionGridCellKind): boolean {
  return (
    kind === 'PAID' ||
    kind === 'PENDING_INVOICE' ||
    kind === 'OVERDUE_INVOICE' ||
    kind === 'FORECAST' ||
    kind === 'SUBSCRIPTION_PENDING'
  );
}

function resolveMonthCell(
  sub: SubscriptionGridRowInput,
  year: number,
  monthIndex: number,
  now: Date,
): SubscriptionGridCell {
  if (!subscriptionOverlapsMonth(sub.billingStartDate, sub.endDate, year, monthIndex)) {
    return { kind: 'NA', invoiceId: null };
  }

  const covering = invoicesCoveringMonth(sub.invoices, year, monthIndex);
  if (covering.length > 0) {
    const { kind, invoiceId } = resolveInvoiceCell(covering, now);
    return { kind, invoiceId };
  }

  if (sub.status === 'PENDING') {
    return { kind: 'SUBSCRIPTION_PENDING', invoiceId: null };
  }

  if (sub.status === 'CANCELLED' || sub.status === 'COMPLETED') {
    return { kind: 'NA', invoiceId: null };
  }

  if (isPastCalendarMonth(year, monthIndex, now)) {
    return { kind: 'MISSED', invoiceId: null };
  }

  return { kind: 'FORECAST', invoiceId: null };
}

export function buildSubscriptionGridPayload(
  subscriptions: SubscriptionGridRowInput[],
  year: number,
  now: Date,
): SubscriptionGridPayload {
  const rows: SubscriptionGridRow[] = subscriptions.map((sub) => {
    const amountMonthly = numericAmount(sub.baseMonthlyAmount);
    const months: SubscriptionGridCell[] = [];
    for (let m = 0; m < 12; m++) {
      months.push(resolveMonthCell(sub, year, m, now));
    }
    const annualTotal = months.reduce((sum, cell) => {
      if (!cellContributesToTotals(cell.kind)) return sum;
      return sum + amountMonthly;
    }, 0);
    return {
      subscriptionId: sub.id,
      projectId: sub.project.id,
      projectName: sub.project.name,
      subscriptionType: sub.type,
      amountMonthly,
      subscriptionStatus: sub.status,
      months,
      annualTotal,
    };
  });

  const monthTotals = Array.from({ length: 12 }, (_, monthIndex) =>
    rows.reduce((sum, row) => {
      const cell = row.months[monthIndex];
      if (!cell || !cellContributesToTotals(cell.kind)) return sum;
      return sum + row.amountMonthly;
    }, 0),
  );

  const grandAnnualTotal = rows.reduce(
    (sum, row) =>
      sum +
      row.months.reduce((rowSum, cell, _idx) => {
        if (!cellContributesToTotals(cell.kind)) return rowSum;
        return rowSum + row.amountMonthly;
      }, 0),
    0,
  );

  return { year, rows, monthTotals, grandAnnualTotal };
}
