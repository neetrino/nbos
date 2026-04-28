import { describe, expect, it } from 'vitest';
import {
  buildPayrollAuditTrailCsvContent,
  buildPayrollJournalCsvContent,
} from './export-payroll-run-journal-audit-csv';
import type { PayrollAuditTrailRow, PayrollJournalEntry } from '@/lib/api/payroll-runs';

const journalSample: PayrollJournalEntry = {
  kind: 'APPROVED',
  at: '2026-04-05T12:00:00.000Z',
  actorEmployeeId: 'e1',
  actorName: 'Pat Lee',
  summary: 'Run approved',
};

const auditSample: PayrollAuditTrailRow = {
  id: 'a1',
  action: 'STATUS_CHANGED',
  createdAt: '2026-04-05T12:01:00.000Z',
  changes: { from: 'REVIEW', to: 'APPROVED' },
  actor: { id: 'e1', firstName: 'Pat', lastName: 'Lee' },
};

describe('buildPayrollJournalCsvContent', () => {
  it('includes header and row', () => {
    const csv = buildPayrollJournalCsvContent([journalSample]);
    expect(csv).toContain('kind,at,actorEmployeeId');
    expect(csv).toContain('APPROVED');
    expect(csv).toContain('Pat Lee');
  });

  it('returns header only when empty', () => {
    expect(buildPayrollJournalCsvContent([])).toBe('kind,at,actorEmployeeId,actorName,summary');
  });
});

describe('buildPayrollAuditTrailCsvContent', () => {
  it('includes changes JSON and actor', () => {
    const csv = buildPayrollAuditTrailCsvContent([auditSample]);
    expect(csv).toContain('action,createdAt');
    expect(csv).toContain('STATUS_CHANGED');
    expect(csv).toContain('Pat Lee');
    expect(csv).toContain('REVIEW');
  });

  it('returns header only when empty', () => {
    expect(buildPayrollAuditTrailCsvContent([])).toBe(
      'id,action,createdAt,actorId,actorName,changesJson',
    );
  });
});
