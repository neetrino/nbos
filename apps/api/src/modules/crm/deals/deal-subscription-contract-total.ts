import { Decimal } from '@nbos/database';

/**
 * Contract total for a fixed-term SUBSCRIPTION deal.
 * `periodAmount` is Deal.amount (one billing period); never divide a contract sum.
 */
export function deriveSubscriptionContractTotal(periodAmount: number, termMonths: number): number {
  return new Decimal(periodAmount).times(termMonths).toNumber();
}
