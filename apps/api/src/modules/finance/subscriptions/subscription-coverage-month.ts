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
  let year = Number(startYm.slice(0, 4));
  let month = Number(startYm.slice(5, 7));
  for (let i = 0; i < monthCount; i++) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}
