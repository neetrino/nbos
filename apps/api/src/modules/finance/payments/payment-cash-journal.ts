/** Idempotency key for the cash journal line created with a Payment. */
export function paymentCashJournalKey(paymentId: string): string {
  return `payment:${paymentId}`;
}

export const PAYMENT_REMOVED_JOURNAL_NOTE = 'Payment removed from invoice card';
