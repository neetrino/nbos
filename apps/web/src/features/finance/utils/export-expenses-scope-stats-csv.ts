import type { FinancePeriod } from '@/features/finance/constants/finance';
import type { ExpenseStats, ExpenseStatsQueryParams } from '@/lib/api/finance';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'GET /finance/expenses/stats only: period (dateFrom/dateTo), optional projectId, optional expensePlanId, optional status, optional activeBoard (aligned with list scope: board vs backlog vs closed vs plan drill-down). Toolbar search, category, type, frequency, backlogReason, and sort are not applied to these aggregates.';

export interface ExpensesScopeStatsCsvMeta {
  period: FinancePeriod;
  statsQuery: ExpenseStatsQueryParams;
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

function appendMetaRows(rows: string[], meta: ExpensesScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'period', meta.period, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
  const q = meta.statsQuery;
  if (q.dateFrom) rows.push(csvLine(['meta', 'stats_dateFrom', q.dateFrom, '', '', '']));
  if (q.dateTo) rows.push(csvLine(['meta', 'stats_dateTo', q.dateTo, '', '', '']));
  if (q.projectId) rows.push(csvLine(['meta', 'stats_projectId', q.projectId, '', '', '']));
  if (q.expensePlanId)
    rows.push(csvLine(['meta', 'stats_expensePlanId', q.expensePlanId, '', '', '']));
  if (q.status) rows.push(csvLine(['meta', 'stats_status', q.status, '', '', '']));
  if (q.activeBoard === true) {
    rows.push(csvLine(['meta', 'stats_activeBoard', 'true', '', '', '']));
  }
}

function appendTotals(rows: string[], stats: ExpenseStats): void {
  rows.push(
    csvLine(['totals', 'totalAmount', formatNullableNumber(stats.totalAmount), '', '', '']),
  );
  rows.push(csvLine(['totals', 'paidAmount', formatNullableNumber(stats.paidAmount), '', '', '']));
  rows.push(
    csvLine(['totals', 'unpaidAmount', formatNullableNumber(stats.unpaidAmount), '', '', '']),
  );
}

function appendByCategory(rows: string[], stats: ExpenseStats): void {
  for (const row of stats.byCategory) {
    rows.push(
      csvLine([
        'by_category',
        row.category,
        String(row._count),
        formatNullableNumber(row._sum.amount),
        '',
        '',
      ]),
    );
  }
}

function appendByStatus(rows: string[], stats: ExpenseStats): void {
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

export function buildExpensesScopeStatsCsvContent(
  stats: ExpenseStats,
  meta: ExpensesScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendTotals(rows, stats);
  appendByCategory(rows, stats);
  appendByStatus(rows, stats);
  return rows.join('\r\n');
}

export function triggerExpensesScopeStatsCsvDownload(
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

function buildExpensesScopeStatsFilename(
  period: FinancePeriod,
  meta: ExpensesScopeStatsCsvMeta,
): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  const q = meta.statsQuery;
  const hints: string[] = [];
  if (q.projectId?.trim()) hints.push(`proj-${q.projectId.trim().slice(0, 8)}`);
  if (q.expensePlanId?.trim()) hints.push(`plan-${q.expensePlanId.trim().slice(0, 8)}`);
  if (q.status?.trim()) hints.push(`st-${q.status.trim().slice(0, 10)}`);
  if (q.activeBoard === true) hints.push('active-board');
  const hintPart = hints.length ? `-${hints.join('-')}` : '';
  return `nbos-expenses-scope-stats-${period}${hintPart}-${dateStamp}.csv`;
}

export function downloadExpensesScopeStatsCsv(
  stats: ExpenseStats,
  meta: ExpensesScopeStatsCsvMeta,
): void {
  const body = buildExpensesScopeStatsCsvContent(stats, meta);
  triggerExpensesScopeStatsCsvDownload(body, buildExpensesScopeStatsFilename(meta.period, meta));
}
