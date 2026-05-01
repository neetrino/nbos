import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { PaymentStats } from '@/lib/api/finance';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /finance/payments/stats only: selected period (dateFrom/dateTo). List search is not applied to these figures.';

export interface PaymentsScopeStatsCsvMeta {
  period: FinancePeriod;
  dateFrom?: string;
  dateTo?: string;
  exportedAtIso: string;
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvLine(cells: readonly string[]): string {
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

function formatNullableNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) return '';
  return String(value);
}

function appendMetaRows(rows: string[], meta: PaymentsScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'period', meta.period, '', '', '']));
  rows.push(csvLine(['meta', 'dateFrom', meta.dateFrom ?? '', 'dateTo', meta.dateTo ?? '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: PaymentStats): void {
  rows.push(csvLine(['totals', 'totalPayments', String(stats.totalPayments), '', '', '']));
  rows.push(
    csvLine(['totals', 'totalCollected', formatNullableNumber(stats.totalCollected), '', '', '']),
  );
  rows.push(
    csvLine([
      'totals',
      'thisMonthCollected',
      formatNullableNumber(stats.thisMonthCollected),
      '',
      '',
      '',
    ]),
  );
}

export function buildPaymentsScopeStatsCsvContent(
  stats: PaymentStats,
  meta: PaymentsScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  return rows.join('\r\n');
}

export function triggerPaymentsScopeStatsCsvDownload(
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

function buildPaymentsScopeStatsFilename(
  period: FinancePeriod,
  meta: PaymentsScopeStatsCsvMeta,
): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-payments-scope-stats-${period}-${dateStamp}.csv`;
}

export function downloadPaymentsScopeStatsCsv(
  stats: PaymentStats,
  meta: PaymentsScopeStatsCsvMeta,
): void {
  const body = buildPaymentsScopeStatsCsvContent(stats, meta);
  triggerPaymentsScopeStatsCsvDownload(body, buildPaymentsScopeStatsFilename(meta.period, meta));
}
