import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { InvoiceStats } from '@/lib/api/finance';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /finance/invoices/stats only: selected period (dateFrom/dateTo) and optional subscriptionId. List search and stage filters are not applied to these figures.';

export interface InvoicesScopeStatsCsvMeta {
  period: FinancePeriod;
  dateFrom?: string;
  dateTo?: string;
  subscriptionId?: string;
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

function appendMetaRows(rows: string[], meta: InvoicesScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'period', meta.period, '', '', '']));
  rows.push(csvLine(['meta', 'dateFrom', meta.dateFrom ?? '', 'dateTo', meta.dateTo ?? '', '']));
  rows.push(csvLine(['meta', 'subscriptionId', meta.subscriptionId ?? '', '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: InvoiceStats): void {
  rows.push(csvLine(['totals', 'totalInvoiceCount', String(stats.total), '', '', '']));
  rows.push(
    csvLine(['totals', 'totalRevenue', formatNullableNumber(stats.totalRevenue), '', '', '']),
  );
  rows.push(
    csvLine([
      'totals',
      'outstanding_count',
      String(stats.outstanding.count),
      'outstanding_amount',
      formatNullableNumber(stats.outstanding.amount),
      '',
    ]),
  );
  rows.push(
    csvLine([
      'totals',
      'overdue_count',
      String(stats.overdue.count),
      'overdue_amount',
      formatNullableNumber(stats.overdue.amount),
      '',
    ]),
  );
}

function appendByStatus(rows: string[], stats: InvoiceStats): void {
  for (const row of stats.byStatus) {
    rows.push(
      csvLine([
        'by_status',
        row.status,
        String(row._count),
        formatNullableNumber(row._sum.amount),
        '',
        '',
      ]),
    );
  }
}

export function buildInvoicesScopeStatsCsvContent(
  stats: InvoiceStats,
  meta: InvoicesScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  return rows.join('\r\n');
}

export function triggerInvoicesScopeStatsCsvDownload(
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

function buildInvoicesScopeStatsFilename(
  period: FinancePeriod,
  meta: InvoicesScopeStatsCsvMeta,
): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  const subPart = meta.subscriptionId?.trim()
    ? `-sub-${meta.subscriptionId.trim().slice(0, 8)}`
    : '';
  return `nbos-invoices-scope-stats-${period}${subPart}-${dateStamp}.csv`;
}

export function downloadInvoicesScopeStatsCsv(
  stats: InvoiceStats,
  meta: InvoicesScopeStatsCsvMeta,
): void {
  const body = buildInvoicesScopeStatsCsvContent(stats, meta);
  triggerInvoicesScopeStatsCsvDownload(body, buildInvoicesScopeStatsFilename(meta.period, meta));
}
