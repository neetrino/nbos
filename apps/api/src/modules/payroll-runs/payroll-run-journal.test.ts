import { describe, it, expect } from 'vitest';
import { buildPayrollRunJournal } from './payroll-run-journal';

describe('buildPayrollRunJournal', () => {
  it('returns created only when no approval or close', () => {
    const rows = buildPayrollRunJournal({
      createdAt: '2026-04-01T10:00:00.000Z',
      approvedAt: null,
      closedAt: null,
      createdBy: { id: 'e1', firstName: 'Ada', lastName: 'Lovelace' },
      approvedBy: null,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('CREATED');
    expect(rows[0].actorEmployeeId).toBe('e1');
    expect(rows[0].actorName).toBe('Ada Lovelace');
  });

  it('orders approved before closed on same clock resolution', () => {
    const rows = buildPayrollRunJournal({
      createdAt: '2026-04-01T10:00:00.000Z',
      approvedAt: '2026-04-05T12:00:00.000Z',
      closedAt: '2026-04-05T12:00:00.000Z',
      createdBy: null,
      approvedBy: { id: 'e2', firstName: 'Grace', lastName: 'Hopper' },
    });
    expect(rows.map((r) => r.kind)).toEqual(['CREATED', 'APPROVED', 'CLOSED']);
  });
});
