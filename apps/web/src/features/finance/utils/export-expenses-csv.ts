import type { Expense } from '@/lib/api/finance';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from './parse-payroll-expense-notes';

const CSV_HEADERS = [
  'id',
  'name',
  'category',
  'type',
  'amount',
  'paidAmount',
  'remainingAmount',
  'paymentStatus',
  'status',
  'frequency',
  'dueDate',
  'projectCode',
  'projectName',
  'isPassThrough',
  'taxStatus',
  'payrollRunId',
  'payrollMonth',
  'notes',
  'createdAt',
] as const;

/** UTF-8 BOM so Excel recognizes encoding when opening the file. */
const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function expenseToCsvCells(expense: Expense): string[] {
  const cells = [
    expense.id,
    expense.name,
    expense.category,
    expense.type,
    expense.amount,
    expense.paidAmount ?? '',
    expense.remainingAmount ?? '',
    expense.paymentStatus ?? '',
    expense.status,
    expense.frequency,
    expense.dueDate ?? '',
    expense.project?.code ?? '',
    expense.project?.name ?? '',
    expense.isPassThrough ? 'yes' : 'no',
    expense.taxStatus,
    resolveExpensePayrollRunId(expense) ?? '',
    resolveExpensePayrollMonthLabel(expense) ?? '',
    expense.notes ?? '',
    expense.createdAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalExpensesCsvLine(expenses: Expense[]): string {
  const amount = sumMoneyStringsMajorUnits(expenses.map((e) => e.amount)).toFixed(2);
  const paid = sumMoneyStringsMajorUnits(expenses.map((e) => e.paidAmount ?? '')).toFixed(2);
  const remaining = sumMoneyStringsMajorUnits(expenses.map((e) => e.remainingAmount ?? '')).toFixed(
    2,
  );
  const cells = [
    '_grand_total',
    `All expenses (${expenses.length})`,
    '',
    '',
    amount,
    paid,
    remaining,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildExpensesCsvContent(expenses: Expense[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (expenses.length === 0) {
    return headerLine;
  }
  const body = expenses.map((e) => expenseToCsvCells(e).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalExpensesCsvLine(expenses)}`;
}

export function triggerExpensesCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadExpensesCsv(expenses: Expense[]): void {
  const content = buildExpensesCsvContent(expenses);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerExpensesCsvDownload(content, `nbos-expenses-${dateStamp}.csv`);
}
