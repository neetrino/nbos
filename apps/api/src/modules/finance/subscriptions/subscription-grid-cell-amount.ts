const FALLBACK_COVERAGE_MONTH_COUNT = 1;

/** Calendar month key `YYYY-MM` for a 0-based month index. */
export function subscriptionGridMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/** Period length used to split an invoice across covered months. */
export function resolveCoverageStep(coverageMonthCount: unknown): number {
  if (
    typeof coverageMonthCount === 'number' &&
    Number.isInteger(coverageMonthCount) &&
    coverageMonthCount >= 1
  ) {
    return coverageMonthCount;
  }
  return FALLBACK_COVERAGE_MONTH_COUNT;
}

/** Issued-month paint: invoice period sum ÷ coverage, never the current subscription rate. */
export function invoiceMonthlyEquivalentAmount(
  amount: number,
  coverageMonthCount: number | null,
): number {
  return amount / resolveCoverageStep(coverageMonthCount);
}
