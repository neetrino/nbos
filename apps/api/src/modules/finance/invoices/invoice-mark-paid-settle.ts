/** Default method when Mark Paid auto-creates a Payment for outstanding. */
export const MARK_PAID_AUTO_PAYMENT_METHOD = 'TRANSACTION';

/** Audit note for payments created by Mark Paid (not Record Payment form). */
export const MARK_PAID_AUTO_PAYMENT_NOTE = 'Auto-created when invoice marked as paid';

/**
 * DI token for `PaymentsService` so Invoices can settle Mark Paid without a
 * static import cycle (invoices → payments → client-services → invoices).
 */
export const PAYMENTS_SERVICE_TOKEN = 'NBOS_PAYMENTS_SERVICE';

export interface MarkPaidPaymentsPort {
  create(data: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<unknown>;
}

/**
 * Calendar date (YYYY-MM-DD) for Payment.paymentDate from a clock instant.
 */
export function markPaidPaymentDateIso(now: Date): string {
  return now.toISOString().slice(0, 10);
}
