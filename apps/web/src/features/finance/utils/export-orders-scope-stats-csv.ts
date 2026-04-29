import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { OrderStats, OrderStatsQueryParams } from '@/lib/api/finance';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

export interface OrdersScopeStatsCsvMeta {
  period: FinancePeriod;
  statsQuery: OrderStatsQueryParams;
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

function buildScopeNote(query: OrderStatsQueryParams): string {
  if (query.gap) {
    return 'GET /finance/orders/stats with gap: includes period (dateFrom/dateTo), reconciliation gap, status filter, search, and optional partnerId — aligned with the reconciliation drill-down list load.';
  }
  return 'GET /finance/orders/stats without gap: includes period (dateFrom/dateTo) and optional partnerId from URL only. Toolbar search and status filters are not sent to stats (list row filters can differ).';
}

function appendMetaRows(rows: string[], meta: OrdersScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'period', meta.period, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', buildScopeNote(meta.statsQuery), '', '', '']));
  const q = meta.statsQuery;
  if (q.dateFrom) rows.push(csvLine(['meta', 'stats_dateFrom', q.dateFrom, '', '', '']));
  if (q.dateTo) rows.push(csvLine(['meta', 'stats_dateTo', q.dateTo, '', '', '']));
  if (q.gap) rows.push(csvLine(['meta', 'stats_gap', q.gap, '', '', '']));
  if (q.status) rows.push(csvLine(['meta', 'stats_status', q.status, '', '', '']));
  if (q.search) rows.push(csvLine(['meta', 'stats_search', q.search, '', '', '']));
  if (q.partnerId) rows.push(csvLine(['meta', 'stats_partnerId', q.partnerId, '', '', '']));
  if (q.projectId) rows.push(csvLine(['meta', 'stats_projectId', q.projectId, '', '', '']));
}

function formatNullableNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) return '';
  return String(value);
}

function appendTotals(rows: string[], stats: OrderStats): void {
  rows.push(csvLine(['totals', 'totalOrders', String(stats.totalOrders), '', '', '']));
  rows.push(
    csvLine(['totals', 'totalAmount', formatNullableNumber(stats.totalAmount), '', '', '']),
  );
  rows.push(
    csvLine(['totals', 'collectedAmount', formatNullableNumber(stats.collectedAmount), '', '', '']),
  );
  rows.push(csvLine(['totals', 'outstandingAmount', String(stats.outstandingAmount), '', '', '']));
}

function appendByStatus(rows: string[], stats: OrderStats): void {
  for (const row of stats.byStatus) {
    rows.push(
      csvLine([
        'by_status',
        row.status,
        String(row._count),
        formatNullableNumber(row._sum.totalAmount),
        '',
        '',
      ]),
    );
  }
}

export function buildOrdersScopeStatsCsvContent(
  stats: OrderStats,
  meta: OrdersScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  return rows.join('\r\n');
}

export function triggerOrdersScopeStatsCsvDownload(
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

function buildOrdersScopeStatsFilename(
  period: FinancePeriod,
  meta: OrdersScopeStatsCsvMeta,
): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  const gapPart = meta.statsQuery.gap ? `-gap-${meta.statsQuery.gap}` : '';
  return `nbos-orders-scope-stats-${period}${gapPart}-${dateStamp}.csv`;
}

export function downloadOrdersScopeStatsCsv(
  stats: OrderStats,
  meta: OrdersScopeStatsCsvMeta,
): void {
  const body = buildOrdersScopeStatsCsvContent(stats, meta);
  triggerOrdersScopeStatsCsvDownload(body, buildOrdersScopeStatsFilename(meta.period, meta));
}
