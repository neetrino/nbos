import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { ExpensePlan } from '@/lib/api/expense-plans';

const CSV_HEADERS = [
  'id',
  'name',
  'category',
  'amount',
  'frequency',
  'frequencyLabel',
  'autoGenerate',
  'nextDueDate',
  'provider',
  'projectId',
  'projectCode',
  'projectName',
  'linkedExpenseCount',
  'notes',
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

function planToCsvCells(row: ExpensePlan): string[] {
  const cells = [
    row.id,
    row.name,
    row.category,
    row.amount,
    row.frequency,
    expensePlanFrequencyLabel(row.frequency),
    row.autoGenerate ? 'true' : 'false',
    row.nextDueDate ?? '',
    row.provider ?? '',
    row.projectId ?? '',
    row.project?.code ?? '',
    row.project?.name ?? '',
    String(row._count.expenses),
    row.notes ?? '',
    row.createdAt,
    row.updatedAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalExpensePlansCsvLine(rows: ExpensePlan[]): string {
  const amount = sumMoneyStringsMajorUnits(rows.map((r) => r.amount)).toFixed(2);
  const linked = rows.reduce((acc, r) => acc + r._count.expenses, 0);
  const cells = [
    '_grand_total',
    `All expense plans (${rows.length})`,
    '',
    amount,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    String(linked),
    '',
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildExpensePlansCsvContent(rows: ExpensePlan[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => planToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalExpensePlansCsvLine(rows)}`;
}

export function triggerExpensePlansCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadExpensePlansCsv(rows: ExpensePlan[]): void {
  const content = buildExpensePlansCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerExpensePlansCsvDownload(content, `nbos-expense-plans-${dateStamp}.csv`);
}
