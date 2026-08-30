import {
  expandCoverageMonthKeys,
  financeCalendarMonthKey,
  isValidCoverageMonthKey,
  shiftCoverageMonthKey,
} from './subscription-coverage-month';
import { countDistinctCoveredMonths, latestCoveredMonthKey } from './subscription-coverage-window';
import {
  invoiceMonthlyEquivalentAmount,
  subscriptionGridMonthKey,
} from './subscription-grid-cell-amount';
import type {
  SubscriptionGridCell,
  SubscriptionGridCellKind,
  SubscriptionGridInvoiceInput,
  SubscriptionGridRowInput,
} from './subscription-grid';

export function numericAmount(value: unknown): number {
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

export function cellCashAmount(cell: SubscriptionGridCell | undefined): number {
  if (!cell || !cellContributesToTotals(cell.kind) || cell.amountMonthly == null) {
    return 0;
  }
  return cell.amountMonthly;
}

export function resolveMonthCell(
  sub: SubscriptionGridRowInput,
  year: number,
  monthIndex: number,
  now: Date,
): SubscriptionGridCell {
  if (!subscriptionOverlapsMonth(sub.billingStartDate, sub.endDate, year, monthIndex)) {
    return emptyGridCell();
  }

  const covering = invoicesCoveringMonth(sub.invoices, year, monthIndex);
  if (covering.length > 0) {
    const { kind, invoiceId } = resolveInvoiceCell(covering, now);
    return {
      kind,
      invoiceId,
      amountMonthly: resolveInvoiceCellAmountMonthly(covering, invoiceId),
    };
  }

  const kind = resolveUncoveredMonthKind(sub, year, monthIndex, now);
  if (kind === 'NA') {
    return emptyGridCell();
  }
  return {
    kind,
    invoiceId: null,
    amountMonthly:
      kind === 'FORECAST' || kind === 'SUBSCRIPTION_PENDING'
        ? numericAmount(sub.monthlyEquivalentAmount)
        : null,
  };
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

function emptyGridCell(): SubscriptionGridCell {
  return { kind: 'NA', invoiceId: null, amountMonthly: null };
}

function invoiceFullyPaid(inv: SubscriptionGridInvoiceInput): boolean {
  const amount = numericAmount(inv.amount);
  const paid = inv.payments.reduce((sum, payment) => sum + numericAmount(payment.amount), 0);
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
  const want = subscriptionGridMonthKey(year, monthIndex);
  const result: SubscriptionGridInvoiceInput[] = [];
  for (const inv of invoices) {
    if (inv.type !== 'SUBSCRIPTION') continue;
    const start = inv.coverageStartMonth;
    const count = inv.coverageMonthCount ?? 1;
    if (!start || !isValidCoverageMonthKey(start) || count < 1) continue;
    if (expandCoverageMonthKeys(start, count).includes(want)) {
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
  const overdue = covering.filter((invoice) => invoiceOverdue(invoice, now));
  if (overdue.length > 0) {
    return { kind: 'OVERDUE_INVOICE', invoiceId: overdue[0].id };
  }
  const unpaid = covering.filter((invoice) => !invoiceFullyPaid(invoice));
  if (unpaid.length > 0) {
    return { kind: 'PENDING_INVOICE', invoiceId: unpaid[0].id };
  }
  return { kind: 'PAID', invoiceId: covering[0].id };
}

function resolveUncoveredMonthKind(
  sub: SubscriptionGridRowInput,
  year: number,
  monthIndex: number,
  now: Date,
): SubscriptionGridCellKind {
  if (sub.status === 'PENDING') return 'SUBSCRIPTION_PENDING';
  if (sub.status === 'CANCELLED' || sub.status === 'COMPLETED') return 'NA';
  if (isPastCalendarMonth(year, monthIndex, now)) return 'MISSED';
  if (!isMonthWithinRemainingTermForecast(sub, year, monthIndex, now)) return 'NA';
  return 'FORECAST';
}

function resolveInvoiceCellAmountMonthly(
  covering: SubscriptionGridInvoiceInput[],
  invoiceId: string | null,
): number | null {
  const invoice = covering.find((row) => row.id === invoiceId);
  if (!invoice) return null;
  return invoiceMonthlyEquivalentAmount(numericAmount(invoice.amount), invoice.coverageMonthCount);
}

function isMonthWithinRemainingTermForecast(
  sub: SubscriptionGridRowInput,
  year: number,
  monthIndex: number,
  now: Date,
): boolean {
  if (sub.termMonths == null) {
    return true;
  }
  const remaining = sub.termMonths - countDistinctCoveredMonths(sub.invoices);
  if (remaining <= 0) {
    return false;
  }
  const targetKey = subscriptionGridMonthKey(year, monthIndex);
  const billingStartKey = financeCalendarMonthKey(sub.billingStartDate);
  const anchor = latestCoveredMonthKey(sub.invoices) ?? shiftCoverageMonthKey(billingStartKey, -1);
  if (!anchor) {
    return false;
  }
  const forecastIndex = countNonPastMonthsAfterThrough(anchor, targetKey, now);
  return forecastIndex >= 1 && forecastIndex <= remaining;
}

function countNonPastMonthsAfterThrough(
  anchorMonthKey: string,
  targetMonthKey: string,
  now: Date,
): number {
  let count = 0;
  let cursor = shiftCoverageMonthKey(anchorMonthKey, 1);
  while (cursor && cursor <= targetMonthKey) {
    const y = Number(cursor.slice(0, 4));
    const m = Number(cursor.slice(5, 7)) - 1;
    if (!isPastCalendarMonth(y, m, now)) {
      count += 1;
    }
    cursor = shiftCoverageMonthKey(cursor, 1);
  }
  return count;
}
