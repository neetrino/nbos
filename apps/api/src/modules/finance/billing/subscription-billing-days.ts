const MAX_BILLING_DAY = 31;

/**
 * Subscription `billingDay` values that should run on `date`.
 * On the last calendar day of the month, also includes days that exceed
 * the month length (e.g. 29–31 on 28 Feb) so they clamp once per month.
 */
export function matchingSubscriptionBillingDays(date: Date): number[] {
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const days = [day];
  if (day !== daysInMonth) {
    return days;
  }
  for (let d = day + 1; d <= MAX_BILLING_DAY; d++) {
    days.push(d);
  }
  return days;
}
