import { financeCalendarMonthKey, isValidCoverageMonthKey } from './subscription-coverage-month';

const FALLBACK_COVERAGE_MONTH_COUNT = 1;

/** Calendar month key `YYYY-MM` for a 0-based month index. */
export function subscriptionGridMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/** Period length used for charge cadence; invalid values fall back to one month. */
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

/**
 * True when `monthKey` is a billing-charge month: billing start, then every
 * `coverageMonthCount` months.
 */
export function isCadenceChargeMonth(
  billingStartDate: Date,
  coverageMonthCount: number,
  monthKey: string,
): boolean {
  if (!isValidCoverageMonthKey(monthKey)) {
    return false;
  }
  const startAbs = monthKeyAbsolute(financeCalendarMonthKey(billingStartDate));
  const targetAbs = monthKeyAbsolute(monthKey);
  if (startAbs == null || targetAbs == null || targetAbs < startAbs) {
    return false;
  }
  const step = resolveCoverageStep(coverageMonthCount);
  return (targetAbs - startAbs) % step === 0;
}

/** Period amount on a cadence charge month; otherwise null. */
export function cadenceChargeDisplayAmount(
  periodAmount: number,
  billingStartDate: Date,
  coverageMonthCount: number,
  monthKey: string,
): number | null {
  if (!isCadenceChargeMonth(billingStartDate, coverageMonthCount, monthKey)) {
    return null;
  }
  return periodAmount;
}

/** Invoice amount only on `coverageStartMonth`; covered follow-on months are null. */
export function invoiceChargeDisplayAmount(
  coverageStartMonth: string | null,
  amount: number,
  monthKey: string,
): number | null {
  if (coverageStartMonth !== monthKey) {
    return null;
  }
  return amount;
}

function monthKeyAbsolute(ym: string): number | null {
  if (!isValidCoverageMonthKey(ym)) {
    return null;
  }
  return Number(ym.slice(0, 4)) * 12 + (Number(ym.slice(5, 7)) - 1);
}
