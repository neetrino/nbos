import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { Order } from '@/lib/api/finance';

const CSV_HEADERS = [
  'id',
  'code',
  'projectId',
  'projectCode',
  'projectName',
  'companyName',
  'type',
  'paymentType',
  'totalAmount',
  'currency',
  'status',
  'invoiceCount',
  'recInvoicedAmount',
  'recPaidAmount',
  'recUninvoicedAmount',
  'recOutstandingAmount',
  'recFullyInvoiced',
  'recFullyPaid',
  'createdAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function sumRecFieldCents(
  rows: Order[],
  pick: (rec: NonNullable<Order['reconciliation']>) => number,
): number {
  let cents = 0;
  for (const row of rows) {
    const r = row.reconciliation;
    if (!r) continue;
    const v = pick(r);
    if (typeof v === 'number' && Number.isFinite(v)) {
      cents += Math.round(v * 100);
    }
  }
  return cents;
}

function orderInvoiceCount(order: Order): number {
  return order._count?.invoices ?? order.invoices.length;
}

function orderToCsvCells(order: Order): string[] {
  const rec = order.reconciliation;
  const cells = [
    order.id,
    order.code,
    order.projectId,
    order.project.code,
    order.project.name,
    order.company?.name ?? '',
    order.type,
    order.paymentType,
    order.totalAmount,
    order.currency,
    order.status,
    String(orderInvoiceCount(order)),
    rec ? rec.invoicedAmount.toFixed(2) : '',
    rec ? rec.paidAmount.toFixed(2) : '',
    rec ? rec.uninvoicedAmount.toFixed(2) : '',
    rec ? rec.outstandingAmount.toFixed(2) : '',
    rec ? (rec.isFullyInvoiced ? 'yes' : 'no') : '',
    rec ? (rec.isFullyPaid ? 'yes' : 'no') : '',
    order.createdAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalOrdersCsvLine(rows: Order[]): string {
  const amount = sumMoneyStringsMajorUnits(rows.map((r) => r.totalAmount)).toFixed(2);
  const invoices = rows.reduce((acc, r) => acc + orderInvoiceCount(r), 0);
  const inv = (sumRecFieldCents(rows, (x) => x.invoicedAmount) / 100).toFixed(2);
  const paid = (sumRecFieldCents(rows, (x) => x.paidAmount) / 100).toFixed(2);
  const uninvoiced = (sumRecFieldCents(rows, (x) => x.uninvoicedAmount) / 100).toFixed(2);
  const outstanding = (sumRecFieldCents(rows, (x) => x.outstandingAmount) / 100).toFixed(2);
  const cells = [
    '_grand_total',
    `All orders (${rows.length})`,
    '',
    '',
    '',
    '',
    '',
    '',
    amount,
    '',
    '',
    String(invoices),
    inv,
    paid,
    uninvoiced,
    outstanding,
    '',
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildOrdersCsvContent(rows: Order[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((o) => orderToCsvCells(o).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalOrdersCsvLine(rows)}`;
}

export function triggerOrdersCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadOrdersCsv(
  rows: Order[],
  options?: { partnerId?: string; gap?: string },
): void {
  const content = buildOrdersCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const partnerPart = options?.partnerId ? `-partner-${options.partnerId.slice(0, 8)}` : '';
  const gapPart = options?.gap ? `-gap-${options.gap}` : '';
  triggerOrdersCsvDownload(content, `nbos-orders${partnerPart}${gapPart}-${dateStamp}.csv`);
}
