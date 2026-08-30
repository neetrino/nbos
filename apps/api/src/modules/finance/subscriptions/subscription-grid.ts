import { cellCashAmount, numericAmount, resolveMonthCell } from './subscription-grid-resolve';

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
  /**
   * Monthly equivalent painted on this cell.
   * Issued months use the covering invoice; forecast/pending use the current rate; else null.
   */
  amountMonthly: number | null;
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
  name: string;
  type: string;
  status: string;
  /** Analytics/display monthly equivalent; never used for invoice amounts. */
  monthlyEquivalentAmount: unknown;
  /** Period sum charged on each billing cadence month. */
  amount: unknown;
  coverageMonthCount: unknown;
  billingStartDate: Date;
  endDate: Date | null;
  /** Null/undefined = open-ended; when set, forecast stops after remaining covered months. */
  termMonths: number | null;
  project: { id: string; name: string };
  invoices: SubscriptionGridInvoiceInput[];
}

export interface SubscriptionGridRow {
  subscriptionId: string;
  /** Commercial display name — primary row label. */
  subscriptionName: string;
  projectId: string;
  /** Secondary line under the subscription name. */
  projectName: string;
  subscriptionType: string;
  amountMonthly: number;
  subscriptionStatus: string;
  months: SubscriptionGridCell[];
  /** Sum of per-cell `amountMonthly` on cells that contribute to cash totals. */
  annualTotal: number;
}

export interface SubscriptionGridPayload {
  year: number;
  rows: SubscriptionGridRow[];
  monthTotals: number[];
  grandAnnualTotal: number;
}

export function buildSubscriptionGridPayload(
  subscriptions: SubscriptionGridRowInput[],
  year: number,
  now: Date,
): SubscriptionGridPayload {
  const rows: SubscriptionGridRow[] = subscriptions.map((sub) => {
    const amountMonthly = numericAmount(sub.monthlyEquivalentAmount);
    const months: SubscriptionGridCell[] = [];
    for (let m = 0; m < 12; m++) {
      months.push(resolveMonthCell(sub, year, m, now));
    }
    const annualTotal = months.reduce((sum, cell) => sum + cellCashAmount(cell), 0);
    return {
      subscriptionId: sub.id,
      subscriptionName: sub.name,
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
    rows.reduce((sum, row) => sum + cellCashAmount(row.months[monthIndex]), 0),
  );

  const grandAnnualTotal = rows.reduce((sum, row) => sum + row.annualTotal, 0);

  return { year, rows, monthTotals, grandAnnualTotal };
}
