import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { Invoice } from '@/lib/api/finance';
import { getInvoiceDealTitle, getOrderDisplayTitle } from '@/features/finance/utils/order-display';

const CSV_HEADERS = [
  'id',
  'code',
  'orderId',
  'orderCode',
  'dealName',
  'subscriptionId',
  'projectId',
  'projectName',
  'companyName',
  'amount',
  'currency',
  'taxStatus',
  'type',
  'moneyStatus',
  'dueDate',
  'paidDate',
  'govInvoiceId',
  'description',
  'coveragePaidAmount',
  'coverageOutstandingAmount',
  'coveragePaymentCount',
  'coverageIsFullyPaid',
  'createdAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function sumCoveragePaidCents(invoices: Invoice[]): number {
  let cents = 0;
  for (const inv of invoices) {
    const p = inv.paymentCoverage?.paidAmount;
    if (typeof p === 'number' && Number.isFinite(p)) {
      cents += Math.round(p * 100);
    }
  }
  return cents;
}

function sumCoverageOutstandingCents(invoices: Invoice[]): number {
  let cents = 0;
  for (const inv of invoices) {
    const o = inv.paymentCoverage?.outstandingAmount;
    if (typeof o === 'number' && Number.isFinite(o)) {
      cents += Math.round(o * 100);
    }
  }
  return cents;
}

function invoiceToCsvCells(invoice: Invoice): string[] {
  const cov = invoice.paymentCoverage;
  const cells = [
    invoice.id,
    invoice.code,
    invoice.orderId ?? '',
    invoice.order ? getOrderDisplayTitle(invoice.order) : '',
    getInvoiceDealTitle(invoice.order) ?? '',
    invoice.subscriptionId ?? '',
    invoice.projectId,
    invoice.project?.name ?? '',
    invoice.company?.name ?? '',
    invoice.amount,
    invoice.currency,
    invoice.taxStatus,
    invoice.type,
    invoice.moneyStatus,
    invoice.dueDate ?? '',
    invoice.paidDate ?? '',
    invoice.govInvoiceId ?? '',
    invoice.description ?? '',
    cov ? cov.paidAmount.toFixed(2) : '',
    cov ? cov.outstandingAmount.toFixed(2) : '',
    cov ? String(cov.paymentCount) : '',
    cov ? (cov.isFullyPaid ? 'yes' : 'no') : '',
    invoice.createdAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalInvoicesCsvLine(invoices: Invoice[]): string {
  const amount = sumMoneyStringsMajorUnits(invoices.map((i) => i.amount)).toFixed(2);
  const paid = (sumCoveragePaidCents(invoices) / 100).toFixed(2);
  const outstanding = (sumCoverageOutstandingCents(invoices) / 100).toFixed(2);
  const paymentCount = invoices.reduce((acc, i) => acc + (i.paymentCoverage?.paymentCount ?? 0), 0);
  const cells = [
    '_grand_total',
    `All invoices (${invoices.length})`,
    '',
    '',
    '',
    '',
    '',
    '',
    amount,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    paid,
    outstanding,
    String(paymentCount),
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildInvoicesCsvContent(invoices: Invoice[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (invoices.length === 0) {
    return headerLine;
  }
  const body = invoices.map((inv) => invoiceToCsvCells(inv).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalInvoicesCsvLine(invoices)}`;
}

export function triggerInvoicesCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadInvoicesCsv(rows: Invoice[], options?: { subscriptionId?: string }): void {
  const content = buildInvoicesCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const subPart = options?.subscriptionId ? `-sub-${options.subscriptionId.slice(0, 8)}` : '';
  triggerInvoicesCsvDownload(content, `nbos-invoices${subPart}-${dateStamp}.csv`);
}
