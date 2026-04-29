import { payrollRunRemainingString2dp } from '@/features/finance/utils/payroll-run-remaining-from-strings';
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

export function buildPayrollRunsCsvContent(rows: PayrollRunListRow[]): string {
  const headerLine = CSV_HEADERS.join(',');
  const body = rows.map((r) => rowToCsvCells(r).join(',')).join('\r\n');
  return body ? `${headerLine}\r\n${body}` : headerLine;
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
