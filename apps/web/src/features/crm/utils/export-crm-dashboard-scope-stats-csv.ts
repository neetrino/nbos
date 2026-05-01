import type { LeadStats } from '@/lib/api/leads';
import type { DealStats } from '@/lib/api/deals';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

const STATS_SCOPE_NOTE =
  'This file combines GET /api/crm/leads/stats and GET /api/crm/deals/stats: workspace-wide CRM aggregates only. The Sales Overview dashboard does not apply list filters to these endpoints; lead/deal list screens use separate filtered queries.';

export interface CrmDashboardScopeStatsCsvMeta {
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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) return '';
  return String(value);
}

function appendMetaRows(rows: string[], meta: CrmDashboardScopeStatsCsvMeta): void {
  rows.push(csvLine(['meta', 'exportedAt', meta.exportedAtIso, '', '', '']));
  rows.push(csvLine(['meta', 'scope_note', STATS_SCOPE_NOTE, '', '', '']));
}

function appendLeadSections(rows: string[], leads: LeadStats): void {
  rows.push(csvLine(['leads_totals', 'total', String(leads.total), '', '', '']));
  for (const row of leads.byStatus) {
    rows.push(csvLine(['leads_by_status', row.status, String(row._count), '', '', '']));
  }
  for (const row of leads.bySource) {
    rows.push(csvLine(['leads_by_source', row.source, String(row._count), '', '', '']));
  }
}

function sumDealAmountsFromByStatus(deals: DealStats): number {
  return deals.byStatus.reduce((acc, row) => acc + Number(row._sum?.amount ?? 0), 0);
}

function appendDealSections(rows: string[], deals: DealStats): void {
  rows.push(csvLine(['deals_totals', 'total', String(deals.total), '', '', '']));
  rows.push(
    csvLine([
      'deals_totals',
      'sumAmountByStatus',
      formatNumber(sumDealAmountsFromByStatus(deals)),
      '',
      '',
      '',
    ]),
  );
  for (const row of deals.byStatus) {
    rows.push(
      csvLine([
        'deals_by_status',
        row.status,
        String(row._count),
        formatNumber(row._sum?.amount ?? null),
        '',
        '',
      ]),
    );
  }
  for (const row of deals.byType ?? []) {
    rows.push(
      csvLine([
        'deals_by_type',
        row.type,
        String(row._count),
        formatNumber(row._sum?.amount ?? null),
        '',
        '',
      ]),
    );
  }
}

export function buildCrmDashboardScopeStatsCsvContent(
  leadStats: LeadStats,
  dealStats: DealStats,
  meta: CrmDashboardScopeStatsCsvMeta,
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  appendMetaRows(rows, meta);
  appendLeadSections(rows, leadStats);
  appendDealSections(rows, dealStats);
  return rows.join('\r\n');
}

export function triggerCrmDashboardScopeStatsCsvDownload(
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

function buildCrmDashboardScopeStatsFilename(meta: CrmDashboardScopeStatsCsvMeta): string {
  const dateStamp = meta.exportedAtIso.slice(0, 10);
  return `nbos-crm-dashboard-scope-stats-${dateStamp}.csv`;
}

export function downloadCrmDashboardScopeStatsCsv(
  leadStats: LeadStats,
  dealStats: DealStats,
  meta: CrmDashboardScopeStatsCsvMeta,
): void {
  const body = buildCrmDashboardScopeStatsCsvContent(leadStats, dealStats, meta);
  triggerCrmDashboardScopeStatsCsvDownload(body, buildCrmDashboardScopeStatsFilename(meta));
}
