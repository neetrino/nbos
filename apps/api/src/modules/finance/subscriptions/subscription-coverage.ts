import { BadRequestException } from '@nestjs/common';
import { type SubscriptionStatusEnum } from '@nbos/database';
import { expandCoverageMonthKeys, isValidCoverageMonthKey } from './subscription-coverage-month';

export const SUBSCRIPTION_STATUSES: SubscriptionStatusEnum[] = [
  'PENDING',
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'COMPLETED',
];

export interface SubscriptionCoverageSummary {
  /** 0–11 index of first paid covered month in the rollup year, or null. */
  firstCoveredMonth: number | null;
  /** Distinct months in the rollup year that are fully paid via invoice coverage. */
  activeMonthCount: number;
  /** Current subscription amount × paid covered months in the rollup year (MRR-style snapshot). */
  annualizedAmount: number;
}

interface PaymentRow {
  amount: unknown;
}

interface InvoiceCoverageRow {
  type: string;
  amount: unknown;
  coverageStartMonth: string | null;
  coverageMonthCount: number | null;
  payments: PaymentRow[];
}

export function assertSubscriptionStatus(status: string): asserts status is SubscriptionStatusEnum {
  if (!SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatusEnum)) {
    throw new BadRequestException(`Invalid subscription status: ${status}`);
  }
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

function sumPaymentAmounts(payments: PaymentRow[]): number {
  return payments.reduce((sum, p) => sum + numericAmount(p.amount), 0);
}

function invoiceFullyPaid(amount: number, payments: PaymentRow[]): boolean {
  return sumPaymentAmounts(payments) >= amount;
}

function paidMonthIndicesInYear(invoices: InvoiceCoverageRow[], year: number): Set<number> {
  const inYear = new Set<number>();
  for (const inv of invoices) {
    if (inv.type !== 'SUBSCRIPTION') continue;
    const amount = Number(inv.amount);
    if (!invoiceFullyPaid(amount, inv.payments)) continue;

    const start = inv.coverageStartMonth;
    const count = inv.coverageMonthCount ?? 1;
    if (!start || !isValidCoverageMonthKey(start) || count < 1) continue;

    for (const ym of expandCoverageMonthKeys(start, count)) {
      const y = Number(ym.slice(0, 4));
      const m = Number(ym.slice(5, 7));
      if (y === year) {
        inYear.add(m - 1);
      }
    }
  }
  return inYear;
}

export function buildSubscriptionCoverageSummary(
  subscription: { baseMonthlyAmount: number | string | { toString(): string } },
  invoices: InvoiceCoverageRow[] | undefined,
  year: number,
): SubscriptionCoverageSummary {
  const rows = invoices ?? [];
  const paidMonths = paidMonthIndicesInYear(rows, year);
  if (paidMonths.size === 0) {
    return emptyCoverage();
  }

  const firstCoveredMonth = Math.min(...paidMonths);
  const unitAmount = Number(subscription.baseMonthlyAmount);

  return {
    firstCoveredMonth,
    activeMonthCount: paidMonths.size,
    annualizedAmount: unitAmount * paidMonths.size,
  };
}

export function attachSubscriptionCoverage<T extends object>(
  subscription: T,
  year = new Date().getFullYear(),
): T & { coverage: SubscriptionCoverageSummary } {
  const row = subscription as T & {
    baseMonthlyAmount: number | string | { toString(): string };
    invoices?: InvoiceCoverageRow[];
  };
  const coverage = buildSubscriptionCoverageSummary(row, row.invoices, year);
  return { ...subscription, coverage };
}

function emptyCoverage(): SubscriptionCoverageSummary {
  return {
    firstCoveredMonth: null,
    activeMonthCount: 0,
    annualizedAmount: 0,
  };
}
