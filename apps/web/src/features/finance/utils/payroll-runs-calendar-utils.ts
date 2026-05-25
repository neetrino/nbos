import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

export const PAYROLL_CALENDAR_MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function payrollMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function parsePayrollMonthParts(
  payrollMonth: string,
): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(payrollMonth.trim());
  const yearPart = match?.[1];
  const monthPart = match?.[2];
  if (yearPart === undefined || monthPart === undefined) return null;
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export interface PayrollRunsCalendarModel {
  years: number[];
  runsByMonthKey: Map<string, PayrollRunListRow>;
}

/** Rows = years (desc), columns = Jan–Dec. */
export function buildPayrollRunsCalendarModel(
  items: ReadonlyArray<PayrollRunListRow>,
): PayrollRunsCalendarModel {
  const runsByMonthKey = new Map<string, PayrollRunListRow>();
  const yearSet = new Set<number>([new Date().getFullYear()]);

  for (const item of items) {
    const parts = parsePayrollMonthParts(item.payrollMonth);
    if (!parts) continue;
    yearSet.add(parts.year);
    runsByMonthKey.set(item.payrollMonth, item);
  }

  const years = [...yearSet].sort((a, b) => b - a);
  return { years, runsByMonthKey };
}
