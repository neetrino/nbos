import type { TaskStats } from '@/lib/api/tasks';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /api/tasks/stats returns workspace-wide task counts by status and priority. The Tasks list uses search, status, priority, and hasParent=false — those filters do not apply to these aggregates.';

export interface TasksScopeStatsCsvMeta {
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

function appendMetaRows(rows: string[], meta: TasksScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendTotals(rows: string[], stats: TaskStats): void {
  rows.push(
    csvLine(['totals', 'tasksCountedByStatus', String(sumCounts(stats.byStatus)), '', '', '']),
  );
}

function appendByStatus(rows: string[], stats: TaskStats): void {
  for (const row of stats.byStatus) {
    rows.push(csvLine(['by_status', row.status, String(row._count), '', '', '']));
  }
}

function appendByPriority(rows: string[], stats: TaskStats): void {
  for (const row of stats.byPriority) {
    rows.push(csvLine(['by_priority', row.priority, String(row._count), '', '', '']));
  }
}

export function buildTasksScopeStatsCsvContent(
  stats: TaskStats,
  meta: TasksScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByStatus(rows, stats);
  appendByPriority(rows, stats);
  return rows.join('\r\n');
}

export function triggerTasksScopeStatsCsvDownload(
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

function buildTasksScopeStatsFilename(meta: TasksScopeStatsCsvMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-tasks-scope-stats-${dateStamp}.csv`;
}

export function downloadTasksScopeStatsCsv(stats: TaskStats, meta: TasksScopeStatsCsvMeta): void {
  const body = buildTasksScopeStatsCsvContent(stats, meta);
  triggerTasksScopeStatsCsvDownload(body, buildTasksScopeStatsFilename(meta));
}
