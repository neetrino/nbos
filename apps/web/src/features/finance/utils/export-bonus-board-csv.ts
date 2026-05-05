import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { BonusEntryListRow } from '@/lib/api/bonus';

const CSV_HEADERS = [
  'id',
  'employeeId',
  'employeeName',
  'projectId',
  'projectCode',
  'projectName',
  'orderId',
  'orderCode',
  'type',
  'amount',
  'percent',
  'status',
  'kpiGatePassed',
  'payoutMonth',
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

function employeeName(emp: BonusEntryListRow['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function boolToCell(value: boolean | null): string {
  if (value === null) {
    return '';
  }
  return value ? 'true' : 'false';
}

function rowToCsvCells(row: BonusEntryListRow): string[] {
  const cells = [
    row.id,
    row.employeeId,
    employeeName(row.employee),
    row.projectId,
    row.project.code,
    row.project.name,
    row.orderId,
    row.order.code,
    row.type,
    row.amount,
    row.percent,
    row.status,
    boolToCell(row.kpiGatePassed),
    row.payoutMonth ?? '',
    row.createdAt,
    row.updatedAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalBonusBoardCsvLine(rows: BonusEntryListRow[]): string {
  const amountSum = sumMoneyStringsMajorUnits(rows.map((r) => r.amount)).toFixed(2);
  const cells = new Array(CSV_HEADERS.length).fill('');
  cells[0] = '_grand_total';
  cells[2] = `Visible rows (${rows.length})`;
  cells[4] = '—';
  cells[5] = '—';
  cells[7] = '—';
  cells[9] = amountSum;
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildBonusBoardCsvContent(rows: BonusEntryListRow[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => rowToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalBonusBoardCsvLine(rows)}`;
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

export interface BonusBoardCsvExportMeta {
  /** When set, server list was scoped to this project (`GET /api/bonus?projectId=`). */
  serverProjectId?: string;
}

export function downloadBonusBoardCsv(
  rows: BonusEntryListRow[],
  meta: BonusBoardCsvExportMeta = {},
): void {
  const content = buildBonusBoardCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const projectPart = meta.serverProjectId ? `-project-${meta.serverProjectId.slice(0, 8)}` : '';
  triggerCsvDownload(content, `nbos-bonus-board-visible${projectPart}-${dateStamp}.csv`);
}
