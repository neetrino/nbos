import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { EmployeeWalletBonusRow, EmployeeWalletSalaryRow } from '@/lib/api/me';

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const BONUS_HEADERS = [
  'id',
  'walletGroup',
  'type',
  'status',
  'amount',
  'percent',
  'projectCode',
  'projectName',
  'orderCode',
  'createdAt',
] as const;

export function buildWalletBonusesCsvContent(rows: EmployeeWalletBonusRow[]): string {
  const headerLine = BONUS_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows
    .map((r) =>
      [
        r.id,
        r.walletGroup,
        r.type,
        r.status,
        r.amount,
        r.percent,
        r.project.code,
        r.project.name,
        r.order.code,
        r.createdAt,
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(','),
    )
    .join('\r\n');
  const grand = grandTotalWalletBonusesCsvLine(rows);
  return `${headerLine}\r\n${body}\r\n${grand}`;
}

function grandTotalWalletBonusesCsvLine(rows: EmployeeWalletBonusRow[]): string {
  const amount = sumMoneyStringsMajorUnits(rows.map((r) => r.amount)).toFixed(2);
  const cells = [
    '_grand_total',
    `All bonus rows (${rows.length})`,
    '',
    '',
    amount,
    '',
    '',
    '',
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

const SALARY_HEADERS = [
  'id',
  'payrollRunId',
  'payrollMonth',
  'runStatus',
  'baseSalary',
  'bonusesTotal',
  'totalPayable',
  'paidAmount',
  'remainingAmount',
  'lineStatus',
  'expenseId',
] as const;

export function buildWalletSalaryCsvContent(rows: EmployeeWalletSalaryRow[]): string {
  const headerLine = SALARY_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows
    .map((r) =>
      [
        r.id,
        r.payrollRunId,
        r.payrollMonth,
        r.runStatus,
        r.baseSalary,
        r.bonusesTotal,
        r.totalPayable,
        r.paidAmount,
        r.remainingAmount,
        r.lineStatus,
        r.expenseId ?? '',
      ]
        .map((c) => escapeCsvCell(String(c)))
        .join(','),
    )
    .join('\r\n');
  const grand = grandTotalWalletSalaryCsvLine(rows);
  return `${headerLine}\r\n${body}\r\n${grand}`;
}

function grandTotalWalletSalaryCsvLine(rows: EmployeeWalletSalaryRow[]): string {
  const base = sumMoneyStringsMajorUnits(rows.map((r) => r.baseSalary)).toFixed(2);
  const bonuses = sumMoneyStringsMajorUnits(rows.map((r) => r.bonusesTotal)).toFixed(2);
  const payable = sumMoneyStringsMajorUnits(rows.map((r) => r.totalPayable)).toFixed(2);
  const paid = sumMoneyStringsMajorUnits(rows.map((r) => r.paidAmount)).toFixed(2);
  const remaining = sumMoneyStringsMajorUnits(rows.map((r) => r.remainingAmount)).toFixed(2);
  const cells = [
    '_grand_total',
    `All payroll rows (${rows.length})`,
    '',
    '',
    base,
    bonuses,
    payable,
    paid,
    remaining,
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

function triggerCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadWalletBonusesCsv(
  rows: EmployeeWalletBonusRow[],
  meta: { employeeId: string },
): void {
  const content = buildWalletBonusesCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(
    content,
    `nbos-wallet-bonuses-${meta.employeeId.slice(0, 8)}-${dateStamp}.csv`,
  );
}

export function downloadWalletSalaryCsv(
  rows: EmployeeWalletSalaryRow[],
  meta: { employeeId: string },
): void {
  const content = buildWalletSalaryCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(
    content,
    `nbos-wallet-payroll-${meta.employeeId.slice(0, 8)}-${dateStamp}.csv`,
  );
}
