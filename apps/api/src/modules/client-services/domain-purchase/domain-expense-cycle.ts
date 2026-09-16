import { CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS } from '../client-service-payment-stage';

const HISTORICAL_STATUSES = ['PAID', 'CANCELLED'] as const;

export interface CycleExpenseRow {
  id: string;
  sourceInvoiceId: string | null;
  dueDate: Date | null;
  status: string;
}

export type CycleMatchKind = 'linked' | 'reuse' | 'create' | 'ambiguous';

export interface CycleMatchResult {
  kind: CycleMatchKind;
  expenseId?: string;
}

function addUtcDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function matchExpenseForPaidInvoice(params: {
  invoiceId: string;
  paidAt: Date;
  expenses: readonly CycleExpenseRow[];
}): CycleMatchResult {
  const already = params.expenses.find((row) => row.sourceInvoiceId === params.invoiceId);
  if (already) return { kind: 'linked', expenseId: already.id };

  const windowStart = addUtcDays(params.paidAt, -CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS);
  const windowEnd = addUtcDays(params.paidAt, CLIENT_SERVICE_RENEWAL_INVOICE_WINDOW_DAYS);
  const candidates = params.expenses.filter((row) =>
    isReusableCycleExpense(row, windowStart, windowEnd),
  );

  if (candidates.length === 1) return { kind: 'reuse', expenseId: candidates[0]!.id };
  if (candidates.length > 1) return { kind: 'ambiguous' };
  return { kind: 'create' };
}

function isReusableCycleExpense(row: CycleExpenseRow, windowStart: Date, windowEnd: Date): boolean {
  if (row.sourceInvoiceId) return false;
  if ((HISTORICAL_STATUSES as readonly string[]).includes(row.status)) return false;
  if (!row.dueDate) return true;
  const due = row.dueDate.getTime();
  return due >= windowStart.getTime() && due <= windowEnd.getTime();
}

export function resolveDomainExpenseAmount(
  ourCost: unknown,
  invoiceAmount: unknown,
): number | null {
  const cost = Number(ourCost);
  if (Number.isFinite(cost) && cost > 0) return cost;
  const snapshot = Number(invoiceAmount);
  if (Number.isFinite(snapshot) && snapshot > 0) return snapshot;
  return null;
}
