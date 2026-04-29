import type { SupportStats } from '@/lib/api/support';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /api/support/stats returns workspace-wide ticket counts grouped by status, priority, and category. The Support list search and toolbar filters apply only to the paginated list fetch, not to these aggregates.';

export interface SupportScopeStatsCsvMeta {
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

function sumCounts(rows: ReadonlyArray<{ _count: number }>): number {
  return rows.reduce((acc, row) => acc + row._count, 0);
}

function appendMetaRows(rows: string[], meta: SupportScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: SupportStats): void {
  const totalByStatus = sumCounts(stats.byStatus);
  rows.push(csvLine(['totals', 'ticketsCountedByStatus', String(totalByStatus), '', '', '']));
}

function appendByStatus(rows: string[], stats: SupportStats): void {
  for (const row of stats.byStatus) {
    rows.push(csvLine(['by_status', row.status, String(row._count), '', '', '']));
  }
}

function appendByPriority(rows: string[], stats: SupportStats): void {
  for (const row of stats.byPriority) {
    rows.push(csvLine(['by_priority', row.priority, String(row._count), '', '', '']));
  }
}

function appendByCategory(rows: string[], stats: SupportStats): void {
  for (const row of stats.byCategory) {
    rows.push(csvLine(['by_category', row.category, String(row._count), '', '', '']));
  }
}

export function buildSupportScopeStatsCsvContent(
  stats: SupportStats,
  meta: SupportScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  appendByPriority(rows, stats);
  appendByCategory(rows, stats);
  return rows.join('\r\n');
}

export function triggerSupportScopeStatsCsvDownload(
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

function buildSupportScopeStatsFilename(meta: SupportScopeStatsCsvMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-support-scope-stats-${dateStamp}.csv`;
}

export function downloadSupportScopeStatsCsv(
  stats: SupportStats,
  meta: SupportScopeStatsCsvMeta,
): void {
  const body = buildSupportScopeStatsCsvContent(stats, meta);
  triggerSupportScopeStatsCsvDownload(body, buildSupportScopeStatsFilename(meta));
}
