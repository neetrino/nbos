import type { PartnerStats } from '@/lib/api/partners';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /api/partners/stats returns workspace-wide aggregates only: total partners, subscriptions with any partner link, and average defaultPercent across all partners. List search, level, direction, and status filters are not applied to these figures.';

export interface PartnersScopeStatsCsvMeta {
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

function appendMetaRows(rows: string[], meta: PartnersScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: PartnerStats): void {
  rows.push(csvLine(['totals', 'total', String(stats.total), '', '', '']));
  rows.push(
    csvLine(['totals', 'totalSubscriptions', String(stats.totalSubscriptions), '', '', '']),
  );
  rows.push(
    csvLine([
      'totals',
      'avgPayoutPercent',
      formatNullableNumber(stats.avgPayoutPercent),
      '',
      '',
      '',
    ]),
  );
}

export function buildPartnersScopeStatsCsvContent(
  stats: PartnerStats,
  meta: PartnersScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  return rows.join('\r\n');
}

export function triggerPartnersScopeStatsCsvDownload(
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

function buildPartnersScopeStatsFilename(meta: PartnersScopeStatsCsvMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-partners-scope-stats-${dateStamp}.csv`;
}

export function downloadPartnersScopeStatsCsv(
  stats: PartnerStats,
  meta: PartnersScopeStatsCsvMeta,
): void {
  const body = buildPartnersScopeStatsCsvContent(stats, meta);
  triggerPartnersScopeStatsCsvDownload(body, buildPartnersScopeStatsFilename(meta));
}
