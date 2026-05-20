/** Last instant of payroll month in UTC (YYYY-MM). */
export function endOfPayrollMonthUtc(payrollMonth: string): Date {
  const [yStr, mStr] = payrollMonth.split('-');
  const y = Number.parseInt(yStr ?? '', 10);
  const m = Number.parseInt(mStr ?? '', 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new Error(`Invalid payrollMonth: ${payrollMonth}`);
  }
  return new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
}

/** First instant of payroll month in UTC (YYYY-MM). */
export function startOfPayrollMonthUtc(payrollMonth: string): Date {
  const [yStr, mStr] = payrollMonth.split('-');
  const y = Number.parseInt(yStr ?? '', 10);
  const m = Number.parseInt(mStr ?? '', 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    throw new Error(`Invalid payrollMonth: ${payrollMonth}`);
  }
  return new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
}
