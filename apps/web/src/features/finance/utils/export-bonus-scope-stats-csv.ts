import type { BonusStats } from '@/lib/api/bonus';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /api/bonus/stats returns workspace-wide aggregates (totalAmount and byStatus counts/sums) only when the bonus list is loaded without a server projectId filter. Board toolbar search, type, employee, and client-side project filter are not applied to these figures. When the list uses ?projectId= (server scope), stats are not fetched and this export is unavailable.';

export interface BonusScopeStatsCsvMeta {
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

function appendMetaRows(rows: string[], meta: BonusScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: BonusStats): void {
  rows.push(csvLine(['totals', 'totalAmount', stats.totalAmount ?? '', '', '', '']));
}

function appendByStatus(rows: string[], stats: BonusStats): void {
  for (const row of stats.byStatus) {
    rows.push(
      csvLine(['by_status', row.status, String(row._count), row._sum.amount ?? '', '', '']),
    );
  }
}

export function buildBonusScopeStatsCsvContent(
  stats: BonusStats,
  meta: BonusScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  return rows.join('\r\n');
}

export function triggerBonusScopeStatsCsvDownload(
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

function buildBonusScopeStatsFilename(meta: BonusScopeStatsCsvMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-bonus-scope-stats-${dateStamp}.csv`;
}

export function downloadBonusScopeStatsCsv(stats: BonusStats, meta: BonusScopeStatsCsvMeta): void {
  const body = buildBonusScopeStatsCsvContent(stats, meta);
  triggerBonusScopeStatsCsvDownload(body, buildBonusScopeStatsFilename(meta));
}
