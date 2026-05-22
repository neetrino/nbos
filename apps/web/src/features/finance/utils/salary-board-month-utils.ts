import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';

export function parseSalaryBoardAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function payrollMonthYear(payrollMonth: string): number | null {
  const match = /^(\d{4})-\d{2}$/.exec(payrollMonth.trim());
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  return Number.isFinite(year) ? year : null;
}

/** Month label without year, e.g. `2026-04` → `April`. */
export function formatPayrollMonthShort(payrollMonth: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(payrollMonth.trim());
  if (!match) return payrollMonth;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10) - 1;
  if (!Number.isFinite(year) || month < 0 || month > 11) return payrollMonth;
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(year, month, 1));
}

export function sumSalaryCellsAmount(
  cells: ReadonlyArray<{ totalPayable: string } | null>,
): number {
  let total = 0;
  for (const cell of cells) {
    if (!cell) continue;
    total += parseSalaryBoardAmount(cell.totalPayable);
  }
  return total;
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
