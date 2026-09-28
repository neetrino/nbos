export const SALES_ACCRUAL_HOLD_REASON = {
  AMBIGUOUS_INVOICE_PURPOSE: 'AMBIGUOUS_INVOICE_PURPOSE',
  AMBIGUOUS_SALES_POLICY: 'AMBIGUOUS_SALES_POLICY',
  INSUFFICIENT_INVOICE_AMOUNT: 'INSUFFICIENT_INVOICE_AMOUNT',
  MISSING_RECEIPT_EVENT: 'MISSING_RECEIPT_EVENT',
  MISSING_SALES_POLICY: 'MISSING_SALES_POLICY',
} as const;

export type SalesAccrualHoldReason =
  (typeof SALES_ACCRUAL_HOLD_REASON)[keyof typeof SALES_ACCRUAL_HOLD_REASON];

export type SalesAccrualHoldNotify = (details: {
  reason: SalesAccrualHoldReason;
  invoiceId: string;
  orderId?: string;
}) => Promise<void>;

type HoldLogger = {
  warn: (meta: object, message: string) => void;
};

type HoldDetails = {
  reason: SalesAccrualHoldReason;
  invoiceId: string;
  orderId?: string;
  [key: string]: unknown;
};

/** Visible Finance hold: do not accrue and do not mutate received money. */
export function logSalesAccrualHold(logger: HoldLogger, details: HoldDetails): void {
  logger.warn(details, 'Sales bonus accrual held');
}

/** Log and notify company-wide finance bonus viewers. Logging alone is not recovery. */
export async function reportSalesAccrualHold(
  logger: HoldLogger,
  notify: SalesAccrualHoldNotify,
  details: HoldDetails,
): Promise<void> {
  logSalesAccrualHold(logger, details);
  try {
    await notify({
      reason: details.reason,
      invoiceId: details.invoiceId,
      orderId: details.orderId,
    });
  } catch {
    logger.warn(
      { invoiceId: details.invoiceId, reason: details.reason },
      'Sales bonus hold notify failed',
    );
  }
}
