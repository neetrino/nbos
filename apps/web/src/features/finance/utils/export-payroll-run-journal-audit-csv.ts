import type { PayrollAuditTrailRow, PayrollJournalEntry } from '@/lib/api/payroll-runs';

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeChangesJson(changes: unknown): string {
  try {
    return JSON.stringify(changes ?? null);
  } catch {
    return '';
  }
}

const JOURNAL_HEADERS = ['kind', 'at', 'actorEmployeeId', 'actorName', 'summary'] as const;

export function buildPayrollJournalCsvContent(entries: PayrollJournalEntry[]): string {
  const headerLine = JOURNAL_HEADERS.join(',');
  if (entries.length === 0) {
    return headerLine;
  }
  const body = entries
    .map((e) =>
      [e.kind, e.at, e.actorEmployeeId ?? '', e.actorName ?? '', e.summary]
        .map((c) => escapeCsvCell(String(c)))
        .join(','),
    )
    .join('\r\n');
  return `${headerLine}\r\n${body}`;
}

const AUDIT_HEADERS = ['id', 'action', 'createdAt', 'actorId', 'actorName', 'changesJson'] as const;

export function buildPayrollAuditTrailCsvContent(rows: PayrollAuditTrailRow[]): string {
  const headerLine = AUDIT_HEADERS.join(',');
  if (rows.length === 0) {
    return headerLine;
  }
  const body = rows
    .map((r) => {
      const actorName = `${r.actor.firstName} ${r.actor.lastName}`.trim();
      return [r.id, r.action, r.createdAt, r.actor.id, actorName, serializeChangesJson(r.changes)]
        .map((c) => escapeCsvCell(String(c)))
        .join(',');
    })
    .join('\r\n');
  return `${headerLine}\r\n${body}`;
}

function triggerCsvDownload(csvBodyWithoutBom: string, filename: string): void {
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

export function downloadPayrollJournalCsv(
  entries: PayrollJournalEntry[],
  meta: { payrollRunId: string; payrollMonth: string },
): void {
  const content = buildPayrollJournalCsvContent(entries);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(
    content,
    `nbos-payroll-${meta.payrollMonth}-journal-${meta.payrollRunId.slice(0, 8)}-${dateStamp}.csv`,
  );
}

export function downloadPayrollAuditTrailCsv(
  rows: PayrollAuditTrailRow[],
  meta: { payrollRunId: string; payrollMonth: string },
): void {
  const content = buildPayrollAuditTrailCsvContent(rows);
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerCsvDownload(
    content,
    `nbos-payroll-${meta.payrollMonth}-audit-${meta.payrollRunId.slice(0, 8)}-${dateStamp}.csv`,
  );
}
