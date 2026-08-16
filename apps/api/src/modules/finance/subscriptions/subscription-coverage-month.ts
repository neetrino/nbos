/** `YYYY-MM` for the **local** calendar month of `d` (aligned with subscription billing day logic). */
export function financeCalendarMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidCoverageMonthKey(value: string): boolean {
  return MONTH_KEY_RE.test(value);
}

/** Returns consecutive month keys starting at `startYm` for `monthCount` months. */
export function expandCoverageMonthKeys(startYm: string, monthCount: number): string[] {
  if (!isValidCoverageMonthKey(startYm) || monthCount < 1) {
    return [];
  }
  const keys: string[] = [];
  let cursor: string | null = startYm;
  for (let i = 0; i < monthCount; i++) {
    if (!cursor) return keys;
    keys.push(cursor);
    cursor = shiftCoverageMonthKey(cursor, 1);
  }
  return keys;
}

/**
 * Shifts a `YYYY-MM` key by `deltaMonths` (may be negative).
 * Returns null when the input key is invalid.
 */
export function shiftCoverageMonthKey(ym: string, deltaMonths: number): string | null {
  if (!isValidCoverageMonthKey(ym) || !Number.isInteger(deltaMonths)) {
    return null;
  }
  const absolute = Number(ym.slice(0, 4)) * 12 + (Number(ym.slice(5, 7)) - 1) + deltaMonths;
  if (absolute < 0) {
    return null;
  }
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Last local instant of the calendar month `ym` (`YYYY-MM`). */
export function lastDateOfCoverageMonth(ym: string): Date | null {
  if (!isValidCoverageMonthKey(ym)) {
    return null;
  }
  const year = Number(ym.slice(0, 4));
  const month = Number(ym.slice(5, 7));
  return new Date(year, month, 0, 23, 59, 59, 999);
}
