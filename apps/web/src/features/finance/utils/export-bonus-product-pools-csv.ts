import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

const CSV_HEADERS = [
  'poolKey',
  'poolKind',
  'anchorOrderId',
  'poolName',
  'orderCode',
  'projectId',
  'projectCode',
  'projectName',
  'entryCount',
  'sumPipelineAmount',
  'sumPaidAmount',
  'sumClawbackAmount',
  'sumTotalAmount',
  'ledgerPlannedAmount',
  'ledgerReleasedAmount',
  'ledgerRemainingAmount',
  'ledgerAvailableFunding',
  'ledgerOverFundingAmount',
  'ledgerReceivedAmount',
  'ledgerPoolStatus',
  'orderIds',
  'orderCodes',
  'employeeCount',
  'fundingFillPercent',
  'fundingHealth',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvCells(row: BonusProductPoolRow): string[] {
  const cells = [
    row.poolKey,
    row.poolKind,
    row.anchorOrderId,
    row.poolName,
    row.orderCode,
    row.projectId,
    row.projectCode,
    row.projectName,
    String(row.entryCount),
    row.sumPipelineAmount,
    row.sumPaidAmount,
    row.sumClawbackAmount,
    row.sumTotalAmount,
    row.ledgerPlannedAmount ?? '',
    row.ledgerReleasedAmount ?? '',
    row.ledgerRemainingAmount ?? '',
    row.ledgerAvailableFunding ?? '',
    row.ledgerOverFundingAmount ?? '',
    row.ledgerReceivedAmount ?? '',
    row.ledgerPoolStatus ?? '',
    row.orderIds.join(';'),
    row.orderCodes.join(';'),
    String(row.employeeCount),
    row.fundingFillPercent != null ? String(row.fundingFillPercent) : '',
    row.fundingHealth,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalCsvLine(rows: BonusProductPoolRow[]): string {
  const entrySum = rows.reduce((acc, r) => acc + r.entryCount, 0);
  const pipeline = sumMoneyStringsMajorUnits(rows.map((r) => r.sumPipelineAmount)).toFixed(2);
  const paid = sumMoneyStringsMajorUnits(rows.map((r) => r.sumPaidAmount)).toFixed(2);
  const clawback = sumMoneyStringsMajorUnits(rows.map((r) => r.sumClawbackAmount)).toFixed(2);
  const total = sumMoneyStringsMajorUnits(rows.map((r) => r.sumTotalAmount)).toFixed(2);
  const cells = [
    '_grand_total',
    '—',
    '—',
    `All pools (${rows.length})`,
    '—',
    '—',
    '—',
    '—',
    String(entrySum),
    pipeline,
    paid,
    clawback,
    total,
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

export function buildBonusProductPoolsCsvContent(rows: BonusProductPoolRow[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => rowToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalCsvLine(rows)}`;
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

export function downloadBonusProductPoolsCsv(rows: BonusProductPoolRow[]): void {
  const content = buildBonusProductPoolsCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(content, `nbos-bonus-product-pools-${dateStamp}.csv`);
}
