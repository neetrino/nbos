import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';

const CSV_HEADERS = [
  'salaryLineId',
  'employeeId',
  'employeeName',
  'payrollMonth',
  'payoutPhase',
  'lineStatus',
  'runStatus',
  'totalPayable',
  'paidAmount',
  'remainingAmount',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvCells(entry: SalaryBoardEntry): string[] {
  const { cell, employee } = entry;
  return [
    cell.salaryLineId,
    employee.id,
    employeeDisplayName(employee),
    entry.payrollMonth,
    cell.payoutPhase,
    cell.lineStatus,
    cell.runStatus,
    cell.totalPayable,
    cell.paidAmount,
    cell.remainingAmount,
  ].map(escapeCsvCell);
}

export function buildSalaryBoardCsvContent(entries: ReadonlyArray<SalaryBoardEntry>): string {
  const headerLine = CSV_HEADERS.join(',');
  const lines = entries.map((e) => rowToCsvCells(e).join(','));
  return [headerLine, ...lines].join('\r\n');
}

export function triggerSalaryBoardCsvDownload(csvBodyWithoutBom: string, filename: string): void {
  const blob = new Blob([`${CSV_UTF8_BOM}${csvBodyWithoutBom}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadSalaryBoardCsv(
  entries: ReadonlyArray<SalaryBoardEntry>,
  opts?: { monthFrom?: string; monthTo?: string },
): void {
  const body = buildSalaryBoardCsvContent(entries);
  const range =
    opts?.monthFrom && opts?.monthTo
      ? `${opts.monthFrom}_${opts.monthTo}`
      : new Date().toISOString().slice(0, 10);
  triggerSalaryBoardCsvDownload(body, `salary-board-${range}.csv`);
}
