import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { Payment } from '@/lib/api/finance';

const CSV_HEADERS = [
  'id',
  'invoiceId',
  'invoiceCode',
  'invoiceType',
  'projectId',
  'projectName',
  'companyName',
  'amount',
  'paymentDate',
  'paymentMethod',
  'confirmedBy',
  'confirmerName',
  'notes',
  'createdAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function confirmerDisplayName(payment: Payment): string {
  const c = payment.confirmer;
  if (!c) return '';
  return `${c.firstName} ${c.lastName}`.trim();
}

function paymentToCsvCells(payment: Payment): string[] {
  const inv = payment.invoice;
  const cells = [
    payment.id,
    payment.invoiceId,
    inv?.code ?? '',
    inv?.type ?? '',
    payment.project?.id ?? '',
    payment.project?.name ?? '',
    payment.company?.name ?? '',
    payment.amount,
    payment.paymentDate,
    payment.paymentMethod ?? '',
    payment.confirmedBy ?? '',
    confirmerDisplayName(payment),
    payment.notes ?? '',
    payment.createdAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalPaymentsCsvLine(rows: Payment[]): string {
  const amount = sumMoneyStringsMajorUnits(rows.map((r) => r.amount)).toFixed(2);
  const cells = [
    '_grand_total',
    '',
    `All payments (${rows.length})`,
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
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildPaymentsCsvContent(rows: Payment[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((p) => paymentToCsvCells(p).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalPaymentsCsvLine(rows)}`;
}

export function triggerPaymentsCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadPaymentsCsv(rows: Payment[]): void {
  const content = buildPaymentsCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerPaymentsCsvDownload(content, `nbos-payments-${dateStamp}.csv`);
}
