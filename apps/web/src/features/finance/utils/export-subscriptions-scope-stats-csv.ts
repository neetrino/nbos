import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { SubscriptionStats, SubscriptionStatsQueryParams } from '@/lib/api/subscriptions';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /finance/subscriptions/stats only: selected period (dateFrom/dateTo) and optional partnerId (aligned with partner drill-down). Toolbar search, type, and status filters are not applied to these figures.';

export interface SubscriptionsScopeStatsCsvMeta {
  period: FinancePeriod;
  statsQuery: SubscriptionStatsQueryParams;
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

function appendMetaRows(rows: string[], meta: SubscriptionsScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'period', meta.period, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
  const q = meta.statsQuery;
  if (q.dateFrom) rows.push(csvLine(['meta', 'stats_dateFrom', q.dateFrom, '', '', '']));
  if (q.dateTo) rows.push(csvLine(['meta', 'stats_dateTo', q.dateTo, '', '', '']));
  if (q.partnerId) rows.push(csvLine(['meta', 'stats_partnerId', q.partnerId, '', '', '']));
}

function appendTotals(rows: string[], stats: SubscriptionStats): void {
  rows.push(csvLine(['totals', 'total', String(stats.total), '', '', '']));
  rows.push(
    csvLine(['totals', 'activeSubscriptions', String(stats.activeSubscriptions), '', '', '']),
  );
  rows.push(
    csvLine(['totals', 'monthlyRevenue', formatNullableNumber(stats.monthlyRevenue), '', '', '']),
  );
}

function appendByStatus(rows: string[], stats: SubscriptionStats): void {
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

function appendByType(rows: string[], stats: SubscriptionStats): void {
  for (const row of stats.byType) {
    rows.push(
      csvLine([
        'by_type',
        row.type,
        String(row._count),
        formatNullableNumber(row._sum.amount),
        '',
        '',
      ]),
    );
  }
}

export function buildSubscriptionsScopeStatsCsvContent(
  stats: SubscriptionStats,
  meta: SubscriptionsScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  appendByType(rows, stats);
  return rows.join('\r\n');
}

export function triggerSubscriptionsScopeStatsCsvDownload(
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

function buildSubscriptionsScopeStatsFilename(
  period: FinancePeriod,
  meta: SubscriptionsScopeStatsCsvMeta,
): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  const partnerPart = meta.statsQuery.partnerId?.trim()
    ? `-partner-${meta.statsQuery.partnerId.trim().slice(0, 8)}`
    : '';
  return `nbos-subscriptions-scope-stats-${period}${partnerPart}-${dateStamp}.csv`;
}

export function downloadSubscriptionsScopeStatsCsv(
  stats: SubscriptionStats,
  meta: SubscriptionsScopeStatsCsvMeta,
): void {
  const body = buildSubscriptionsScopeStatsCsvContent(stats, meta);
  triggerSubscriptionsScopeStatsCsvDownload(
    body,
    buildSubscriptionsScopeStatsFilename(meta.period, meta),
  );
}
