/** One-click annual subscription term length (months). */
export const DEAL_SUBSCRIPTION_TERM_ANNUAL_MONTHS = 12;

/**
 * Maintenance subscriptions are open-ended, so the term-months control does not apply.
 * Product and extension subscriptions still collect a fixed term.
 */
export function dealSubscriptionTermFieldVisible(
  dealType: string | null,
  paymentType: string | null,
): boolean {
  if (dealType === 'MAINTENANCE') return false;
  return paymentType === 'SUBSCRIPTION';
}
