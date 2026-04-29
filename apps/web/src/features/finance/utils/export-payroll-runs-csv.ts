import {
  payrollRunRemainingString2dp,
  sumMoneyStringsMajorUnits,
  sumPayrollRunsRemainingMajorUnits,
} from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

const CSV_HEADERS = [
  'id',
  'payrollMonth',
  'status',
  'salaryLinesCount',
  'materializedExpenseLineCount',
  'totalBaseSalary',
  'totalBonuses',
  'totalAdjustments',
  'totalDeductions',
  'totalPayable',
  'totalPaid',
  'totalRemaining',
  'createdAt',
  'updatedAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvCells(row: PayrollRunListRow): string[] {
  const cells = [
    row.id,
    row.payrollMonth,
    row.status,
    String(row._count.salaryLines),
    String(row.materializedExpenseLineCount),
    row.totalBaseSalary,
    row.totalBonuses,
    row.totalAdjustments,
    row.totalDeductions,
    row.totalPayable,
    row.totalPaid,
    payrollRunRemainingString2dp(row.totalPayable, row.totalPaid),
    row.createdAt,
    row.updatedAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalPayrollRunsCsvLine(rows: PayrollRunListRow[]): string {
  const salaryLines = rows.reduce((acc, r) => acc + r._count.salaryLines, 0);
  const materialized = rows.reduce((acc, r) => acc + r.materializedExpenseLineCount, 0);
  const base = sumMoneyStringsMajorUnits(rows.map((r) => r.totalBaseSalary)).toFixed(2);
  const bonuses = sumMoneyStringsMajorUnits(rows.map((r) => r.totalBonuses)).toFixed(2);
  const adjustments = sumMoneyStringsMajorUnits(rows.map((r) => r.totalAdjustments)).toFixed(2);
  const deductions = sumMoneyStringsMajorUnits(rows.map((r) => r.totalDeductions)).toFixed(2);
  const payable = sumMoneyStringsMajorUnits(rows.map((r) => r.totalPayable)).toFixed(2);
  const paid = sumMoneyStringsMajorUnits(rows.map((r) => r.totalPaid)).toFixed(2);
  const remaining = sumPayrollRunsRemainingMajorUnits(rows).toFixed(2);
  const cells = [
    '_grand_total',
    `All runs (${rows.length})`,
    '',
    String(salaryLines),
    String(materialized),
    base,
    bonuses,
    adjustments,
    deductions,
    payable,
    paid,
    remaining,
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildPayrollRunsCsvContent(rows: PayrollRunListRow[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => rowToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalPayrollRunsCsvLine(rows)}`;
}

export function triggerPayrollRunsCsvDownload(csvBodyWithoutBom: string, filename: string): void {
  const blob = new Blob([`${CSV_UTF8_BOM}${csvBodyWithoutBom}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadPayrollRunsCsv(
  rows: PayrollRunListRow[],
  options?: {
    statusScope?: string;
    payrollMonthFrom?: string;
    payrollMonthTo?: string;
  },
): void {
  const content = buildPayrollRunsCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const statusPart =
    options?.statusScope && options.statusScope !== 'ALL'
      ? `-${options.statusScope.toLowerCase()}`
      : '';
  const fromPart = options?.payrollMonthFrom ? `-from-${options.payrollMonthFrom}` : '';
  const toPart = options?.payrollMonthTo ? `-to-${options.payrollMonthTo}` : '';
  triggerPayrollRunsCsvDownload(
    content,
    `nbos-payroll-runs-${dateStamp}${statusPart}${fromPart}${toPart}.csv`,
  );
}
