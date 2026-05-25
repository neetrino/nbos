import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';

export function parseSalaryBoardAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Month and year, e.g. `2026-04` → `April 2026`. */
export function formatPayrollMonthLabel(payrollMonth: string): string {
  const parts = /^(\d{4})-(\d{2})$/.exec(payrollMonth.trim());
  if (!parts) return payrollMonth;
  return `${formatPayrollMonthShort(payrollMonth)} ${parts[1]}`;
}

/** Short month label, e.g. `2026-04` → `Apr`. */
export function formatPayrollMonthAbbrev(payrollMonth: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(payrollMonth.trim());
  const yearPart = match?.[1];
  const monthPart = match?.[2];
  if (yearPart === undefined || monthPart === undefined) return payrollMonth;
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return payrollMonth;
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(year, month, 1));
}

/** Month label without year, e.g. `2026-04` → `April`. */
export function formatPayrollMonthShort(payrollMonth: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(payrollMonth.trim());
  const yearPart = match?.[1];
  const monthPart = match?.[2];
  if (yearPart === undefined || monthPart === undefined) return payrollMonth;
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return payrollMonth;
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(year, month, 1));
}

export function sumSalaryBoardColumn(
  rows: SalaryBoardResponse['rows'],
  columnIndex: number,
): number {
  let total = 0;
  for (const row of rows) {
    const cell = row.cells[columnIndex];
    if (cell) total += parseSalaryBoardAmount(cell.totalPayable);
  }
  return total;
}

export function sumSalaryBoardRow(
  row: SalaryBoardResponse['rows'][number],
  columnCount: number,
): number {
  let total = 0;
  for (let i = 0; i < columnCount; i += 1) {
    const cell = row.cells[i];
    if (cell) total += parseSalaryBoardAmount(cell.totalPayable);
  }
  return total;
}

export function sumSalaryBoardRowsTotal(
  rows: SalaryBoardResponse['rows'],
  columnCount: number,
): number {
  let total = 0;
  for (const row of rows) {
    total += sumSalaryBoardRow(row, columnCount);
  }
  return total;
}
