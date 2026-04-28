/** NBOS payroll month key (UTC planning month), e.g. `2026-03`. */
export const PAYROLL_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidPayrollMonth(value: string): boolean {
  return PAYROLL_MONTH_REGEX.test(value);
}
