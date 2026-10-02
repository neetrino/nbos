import { payrollMonthForInstant } from '../compensation-profiles/compensation-profile-payroll-month';

export type SalesBonusReceiptSource = {
  paidDate: Date | null;
  payments: Array<{ paymentDate: Date }>;
};

function latestPaymentDate(payments: Array<{ paymentDate: Date }>): Date | null {
  let latest: Date | null = null;
  for (const payment of payments) {
    if (latest == null || payment.paymentDate.getTime() > latest.getTime()) {
      latest = payment.paymentDate;
    }
  }
  return latest;
}

/**
 * Confirmed receipt that completes payment. Never falls back to job run time
 * or invoice creation time (Q-40).
 */
export function salesBonusReceiptEventAt(source: SalesBonusReceiptSource): Date | null {
  if (source.paidDate != null) {
    return source.paidDate;
  }
  return latestPaymentDate(source.payments);
}

/** Earned payroll month of the completing receipt in the company calendar. */
export function salesBonusEarnedPeriod(receiptAt: Date): string {
  return payrollMonthForInstant(receiptAt);
}
