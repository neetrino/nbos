import type { FinanceDashboardData } from '@/features/finance/components/dashboard/finance-dashboard-data';
import type { FinancePeriod } from '@/features/finance/constants/finance';

const CSV_UTF8_BOM = '\uFEFF';

const HEADER = ['section', 'col1', 'col2', 'col3', 'col4', 'col5'] as const;

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvLine(cells: readonly string[]): string {
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

function appendKpis(rows: string[], data: FinanceDashboardData): void {
  rows.push(csvLine(['kpi', 'totalRevenue', data.totalRevenue.toFixed(2), '', '', '']));
  rows.push(csvLine(['kpi', 'outstandingAmount', data.outstandingAmount.toFixed(2), '', '', '']));
  rows.push(csvLine(['kpi', 'overdueAmount', data.overdueAmount.toFixed(2), '', '', '']));
  rows.push(
    csvLine([
      'kpi',
      'monthlyRecurringRevenue',
      data.monthlyRecurringRevenue.toFixed(2),
      '',
      '',
      '',
    ]),
  );
}

function appendInvoiceStatus(rows: string[], data: FinanceDashboardData): void {
  for (const item of data.invoiceStatusItems) {
    rows.push(
      csvLine([
        'invoice_status',
        item.label,
        String(item.count),
        item.amount.toFixed(2),
        String(item.pct),
        '',
      ]),
    );
  }
}

function appendReconciliation(rows: string[], data: FinanceDashboardData): void {
  const r = data.reconciliation;
  const metrics: [string, string][] = [
    ['orderCount', String(r.orderCount)],
    ['orderAmount', r.orderAmount.toFixed(2)],
    ['invoicedAmount', r.invoicedAmount.toFixed(2)],
    ['paidAmount', r.paidAmount.toFixed(2)],
    ['uninvoicedAmount', r.uninvoicedAmount.toFixed(2)],
    ['outstandingAmount', r.outstandingAmount.toFixed(2)],
    ['fullyInvoicedCount', String(r.fullyInvoicedCount)],
    ['fullyPaidCount', String(r.fullyPaidCount)],
  ];
  for (const [key, val] of metrics) {
    rows.push(csvLine(['reconciliation', key, val, '', '', '']));
  }
  for (const w of r.warnings) {
    rows.push(csvLine(['reconciliation_warning', w.code, w.message, String(w.count), '', '']));
  }
}

function appendRecentPayments(rows: string[], data: FinanceDashboardData): void {
  for (const p of data.recentPayments) {
    rows.push(
      csvLine(['recent_payment', p.id, p.client, p.invoice, p.amount.toFixed(2), p.dateLabel]),
    );
  }
}

function appendUpcomingInvoices(rows: string[], data: FinanceDashboardData): void {
  for (const inv of data.upcomingInvoices) {
    rows.push(
      csvLine([
        'upcoming_invoice',
        inv.id,
        inv.invoice,
        inv.client,
        inv.amount.toFixed(2),
        `${inv.dueDateLabel} (${inv.daysLeft}d)`,
      ]),
    );
  }
}

/** Multi-section snapshot: KPIs, invoice mix, reconciliation, recent payments, upcoming invoices. */
export function buildFinanceDashboardCsvContent(
  data: FinanceDashboardData,
  options: { period: FinancePeriod },
): string {
  const rows: string[] = [];
  rows.push(csvLine(HEADER));
  rows.push(csvLine(['meta', 'period', options.period, '', '', '']));
  appendKpis(rows, data);
  appendInvoiceStatus(rows, data);
  appendReconciliation(rows, data);
  appendRecentPayments(rows, data);
  appendUpcomingInvoices(rows, data);
  return rows.join('\r\n');
}

export function triggerFinanceDashboardCsvDownload(
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

export function downloadFinanceDashboardCsv(
  data: FinanceDashboardData,
  period: FinancePeriod,
): void {
  const body = buildFinanceDashboardCsvContent(data, { period });
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerFinanceDashboardCsvDownload(body, `nbos-finance-dashboard-${period}-${dateStamp}.csv`);
}
