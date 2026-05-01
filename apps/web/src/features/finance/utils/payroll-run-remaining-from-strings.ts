/**
 * Payroll run list rows expose `totalPayable` / `totalPaid` as decimal strings (typically 2dp).
 * Cent integers avoid float drift when deriving remaining for CSV and UI.
 */

function parseMoneyToCents(value: string): number {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round(n * 100);
}

/** Payable minus paid in major currency units (e.g. dollars from cent integers). */
export function payrollRunRemainingMajorUnits(totalPayable: string, totalPaid: string): number {
  return (parseMoneyToCents(totalPayable) - parseMoneyToCents(totalPaid)) / 100;
}

/** Fixed two-decimal string for CSV cells. */
export function payrollRunRemainingString2dp(totalPayable: string, totalPaid: string): string {
  return payrollRunRemainingMajorUnits(totalPayable, totalPaid).toFixed(2);
}

/** Sum of per-run (payable − paid) in major units (visible page / client roll-up). */
export function sumPayrollRunsRemainingMajorUnits(
  rows: ReadonlyArray<{ totalPayable: string; totalPaid: string }>,
): number {
  let cents = 0;
  for (const row of rows) {
    cents += parseMoneyToCents(row.totalPayable) - parseMoneyToCents(row.totalPaid);
  }
  return cents / 100;
}

/** Sum independent NBOS decimal money strings (e.g. column roll-ups) in cent space. */
export function sumMoneyStringsMajorUnits(values: ReadonlyArray<string>): number {
  let cents = 0;
  for (const v of values) {
    cents += parseMoneyToCents(v);
  }
  return cents / 100;
}
