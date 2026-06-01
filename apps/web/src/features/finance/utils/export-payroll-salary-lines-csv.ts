import type { SalaryLineRow } from '@/lib/api/payroll-runs';

const CSV_HEADERS = [
  'payrollRunId',
  'payrollMonth',
  'salaryLineId',
  'employeeId',
  'employeeName',
  'baseSalary',
  'bonusesTotal',
  'totalPayable',
  'paidAmount',
  'remainingAmount',
  'lineStatus',
  'expenseId',
  'expenseName',
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

function employeeDisplayName(emp: SalaryLineRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function rowToCsvCells(row: SalaryLineRow, payrollMonth: string): string[] {
  const cells = [
    row.payrollRunId,
    payrollMonth,
    row.id,
    row.employeeId,
    employeeDisplayName(row.employee),
    row.baseSalary,
    row.bonusesTotal,
    row.totalPayable,
    row.paidAmount,
    row.remainingAmount,
    row.status,
    row.expense?.id ?? '',
    row.expense?.name ?? '',
    row.createdAt,
    row.updatedAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

export function buildPayrollSalaryLinesCsvContent(
  rows: SalaryLineRow[],
  payrollMonth: string,
): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => rowToCsvCells(r, payrollMonth).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}`;
}

export function triggerPayrollSalaryLinesCsvDownload(
  csvBodyWithoutBom: string,
  filename: string,
): void {
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

export function downloadPayrollSalaryLinesCsv(
  rows: SalaryLineRow[],
  meta: { payrollRunId: string; payrollMonth: string },
): void {
  const content = buildPayrollSalaryLinesCsvContent(rows, meta.payrollMonth);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerPayrollSalaryLinesCsvDownload(
    content,
    `nbos-payroll-${meta.payrollMonth}-salary-lines-${meta.payrollRunId.slice(0, 8)}-${dateStamp}.csv`,
  );
}
