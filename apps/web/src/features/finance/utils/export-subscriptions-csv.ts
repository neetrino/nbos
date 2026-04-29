import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import type { Subscription } from '@/lib/api/subscriptions';

const CSV_HEADERS = [
  'id',
  'code',
  'projectId',
  'projectCode',
  'projectName',
  'type',
  'amount',
  'billingDay',
  'taxStatus',
  'status',
  'startDate',
  'endDate',
  'companyName',
  'partnerId',
  'partnerName',
  'invoiceCount',
  'coverageFirstCoveredMonth',
  'coverageActiveMonthCount',
  'coverageAnnualizedAmount',
  'createdAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function sumAnnualizedCents(subscriptions: Subscription[]): number {
  let cents = 0;
  for (const s of subscriptions) {
    const a = s.coverage?.annualizedAmount;
    if (typeof a === 'number' && Number.isFinite(a)) {
      cents += Math.round(a * 100);
    }
  }
  return cents;
}

function subscriptionToCsvCells(row: Subscription): string[] {
  const cov = row.coverage;
  const cells = [
    row.id,
    row.code,
    row.projectId,
    row.project.code,
    row.project.name,
    row.type,
    row.amount,
    String(row.billingDay),
    row.taxStatus,
    row.status,
    row.startDate,
    row.endDate ?? '',
    row.company?.name ?? '',
    row.partner?.id ?? '',
    row.partner?.name ?? '',
    String(row.invoices.length),
    cov && cov.firstCoveredMonth !== null ? String(cov.firstCoveredMonth) : '',
    cov ? String(cov.activeMonthCount) : '',
    cov && Number.isFinite(cov.annualizedAmount) ? cov.annualizedAmount.toFixed(2) : '',
    row.createdAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalSubscriptionsCsvLine(rows: Subscription[]): string {
  const amount = sumMoneyStringsMajorUnits(rows.map((r) => r.amount)).toFixed(2);
  const activeMonths = rows.reduce((acc, r) => acc + (r.coverage?.activeMonthCount ?? 0), 0);
  const annualized = (sumAnnualizedCents(rows) / 100).toFixed(2);
  const invoiceCount = rows.reduce((acc, r) => acc + r.invoices.length, 0);
  const cells = [
    '_grand_total',
    `All subscriptions (${rows.length})`,
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
    '',
    String(invoiceCount),
    '',
    String(activeMonths),
    annualized,
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildSubscriptionsCsvContent(rows: Subscription[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((r) => subscriptionToCsvCells(r).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalSubscriptionsCsvLine(rows)}`;
}

export function triggerSubscriptionsCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadSubscriptionsCsv(
  rows: Subscription[],
  options?: { partnerId?: string },
): void {
  const content = buildSubscriptionsCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const partnerPart = options?.partnerId ? `-partner-${options.partnerId.slice(0, 8)}` : '';
  triggerSubscriptionsCsvDownload(content, `nbos-subscriptions${partnerPart}-${dateStamp}.csv`);
}
