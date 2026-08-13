/**
 * Contract total for a fixed-term SUBSCRIPTION deal.
 * `periodAmount` is Deal.amount (one billing period); never divide a contract sum.
 */
export function deriveDealSubscriptionContractTotal(
  periodAmount: number | null,
  termMonths: number | null,
): number | null {
  if (periodAmount == null || termMonths == null) {
    return null;
  }
  if (!Number.isFinite(periodAmount) || !Number.isInteger(termMonths) || termMonths < 1) {
    return null;
  }
  return periodAmount * termMonths;
}
