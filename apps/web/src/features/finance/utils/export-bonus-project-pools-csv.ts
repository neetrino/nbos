import type { BonusProjectPoolRow } from '@/lib/api/bonus';

const CSV_HEADERS = [
  'projectId',
  'projectCode',
  'projectName',
  'entryCount',
  'sumPipelineAmount',
  'sumPaidAmount',
  'sumClawbackAmount',
  'sumTotalAmount',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToCsvCells(row: BonusProjectPoolRow): string[] {
  const cells = [
    row.projectId,
    row.projectCode,
    row.projectName,
    String(row.entryCount),
    row.sumPipelineAmount,
    row.sumPaidAmount,
    row.sumClawbackAmount,
    row.sumTotalAmount,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

export function buildBonusProjectPoolsCsvContent(rows: BonusProjectPoolRow[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => rowToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}`;
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

export function downloadBonusProjectPoolsCsv(rows: BonusProjectPoolRow[]): void {
  const content = buildBonusProjectPoolsCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(content, `nbos-bonus-project-pools-${dateStamp}.csv`);
}
