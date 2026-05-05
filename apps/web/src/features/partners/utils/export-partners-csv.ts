import type { Partner } from '@/lib/api/partners';

const CSV_HEADERS = [
  'id',
  'name',
  'level',
  'direction',
  'defaultPercent',
  'status',
  'contactName',
  'contactId',
  'ordersCount',
  'subscriptionsCount',
  'createdAt',
  'updatedAt',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function contactDisplayName(partner: Partner): string {
  const c = partner.contact;
  if (!c) return '';
  return `${c.firstName} ${c.lastName}`.trim();
}

function partnerToCsvCells(partner: Partner): string[] {
  const orders = partner._count?.orders ?? 0;
  const subs = partner._count?.subscriptions ?? 0;
  const cells = [
    partner.id,
    partner.name,
    partner.level,
    partner.direction,
    partner.defaultPercent,
    partner.status,
    contactDisplayName(partner),
    partner.contactId ?? '',
    String(orders),
    String(subs),
    partner.createdAt,
    partner.updatedAt,
  ];
  return cells.map((c) => escapeCsvCell(String(c)));
}

function grandTotalPartnersCsvLine(rows: Partner[]): string {
  let orders = 0;
  let subs = 0;
  for (const p of rows) {
    orders += p._count?.orders ?? 0;
    subs += p._count?.subscriptions ?? 0;
  }
  const cells = [
    '_grand_total',
    `All partners (${rows.length})`,
    '',
    '',
    '',
    '',
    '',
    '',
    String(orders),
    String(subs),
    '',
    '',
  ];
  return cells.map((c) => escapeCsvCell(String(c))).join(',');
}

export function buildPartnersCsvContent(rows: Partner[]): string {
  const headerLine = CSV_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows.map((p) => partnerToCsvCells(p).join(',')).join('\r\n');
  return `${headerLine}\r\n${body}\r\n${grandTotalPartnersCsvLine(rows)}`;
}

export function triggerPartnersCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadPartnersCsv(rows: Partner[]): void {
  const content = buildPartnersCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerPartnersCsvDownload(content, `nbos-partners-${dateStamp}.csv`);
}
