import type { PayrollRunStats, PayrollRunStatus } from '@/lib/api/payroll-runs';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const SCOPE_TOTAL_METRICS = [
  'runCount',
  'totalBaseSalary',
  'totalBonuses',
  'totalPayable',
  'totalPaid',
  'totalRemaining',
] as const;

export interface PayrollRunsScopeStatsCsvFilterMeta {
  statusScope: PayrollRunStatus | 'ALL';
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
  /** Caller-supplied timestamp for audit row (tests may inject a fixed value). */
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

function scopeTotalsValue(
  stats: PayrollRunStats,
  metric: (typeof SCOPE_TOTAL_METRICS)[number],
): string {
  if (metric === 'runCount') {
    return String(stats.runCount);
  }
  return stats.totals[metric];
}

function appendMetaRows(rows: string[], meta: PayrollRunsScopeStatsCsvFilterMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'statusFilter', meta.statusScope, '', '', '']));
  rows.push(csvLine(['meta', 'payrollMonthFrom', meta.payrollMonthFrom ?? '', '', '', '']));
  rows.push(csvLine(['meta', 'payrollMonthTo', meta.payrollMonthTo ?? '', '', '', '']));
}

function appendScopeTotals(rows: string[], stats: PayrollRunStats): void {
  for (const metric of SCOPE_TOTAL_METRICS) {
    rows.push(csvLine(['scope_totals', metric, scopeTotalsValue(stats, metric), '', '', '']));
  }
}

function appendByStatus(rows: string[], stats: PayrollRunStats): void {
  for (const row of stats.byStatus) {
    rows.push(
      csvLine([
        'by_status',
        row.status,
        String(row.runCount),
        row.totalPayable,
        row.totalPaid,
        row.totalRemaining,
      ]),
    );
  }
}

/** UTF-8 CSV without BOM; BOM is applied in `triggerPayrollRunsScopeStatsCsvDownload`. */
export function buildPayrollRunsScopeStatsCsvContent(
  stats: PayrollRunStats,
  meta: PayrollRunsScopeStatsCsvFilterMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendScopeTotals(rows, stats);
  appendByStatus(rows, stats);
  return rows.join('\r\n');
}

export function triggerPayrollRunsScopeStatsCsvDownload(
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

function buildScopeStatsFilename(meta: PayrollRunsScopeStatsCsvFilterMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  const statusPart = meta.statusScope !== 'ALL' ? `-${meta.statusScope.toLowerCase()}` : '';
  const fromPart = meta.payrollMonthFrom ? `-from-${meta.payrollMonthFrom}` : '';
  const toPart = meta.payrollMonthTo ? `-to-${meta.payrollMonthTo}` : '';
  return `nbos-payroll-runs-scope-stats-${dateStamp}${statusPart}${fromPart}${toPart}.csv`;
}

export function downloadPayrollRunsScopeStatsCsv(
  stats: PayrollRunStats,
  meta: PayrollRunsScopeStatsCsvFilterMeta,
): void {
  const body = buildPayrollRunsScopeStatsCsvContent(stats, meta);
  triggerPayrollRunsScopeStatsCsvDownload(body, buildScopeStatsFilename(meta));
}
