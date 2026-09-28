import { Decimal } from '@nbos/database';

export type PaymentSelect = {
  id?: boolean;
  amount?: boolean;
  notes?: boolean;
  paymentDate?: boolean;
};

export type StoredPayment = {
  id: string;
  amount: Decimal;
  notes: string | null;
  paymentDate: Date;
};

export function projectPayments(
  rows: StoredPayment[],
  select: PaymentSelect | true | undefined,
): Array<Record<string, unknown>> {
  if (select == null || select === true) {
    return rows.map((row) => ({ ...row }));
  }
  return rows.map((row) => projectOnePayment(row, select));
}

function projectOnePayment(row: StoredPayment, select: PaymentSelect): Record<string, unknown> {
  const projected: Record<string, unknown> = {};
  if (select.id === true) {
    projected.id = row.id;
  }
  if (select.amount === true) {
    projected.amount = row.amount;
  }
  if (select.notes === true) {
    projected.notes = row.notes;
  }
  if (select.paymentDate === true) {
    projected.paymentDate = row.paymentDate;
  }
  return projected;
}

export function expensePaymentsFromQuery(
  args: {
    include?: { expensePayments?: true | { select?: PaymentSelect } };
  },
  rows: StoredPayment[],
): Array<Record<string, unknown>> {
  const included = args.include?.expensePayments;
  if (included == null || included === true) {
    return projectPayments(rows, true);
  }
  return projectPayments(rows, included.select);
}
