import { describe, expect, it } from 'vitest';
import { buildBonusBoardCsvContent } from './export-bonus-board-csv';
import type { BonusEntryListRow } from '@/lib/api/bonus';

const sampleRow: BonusEntryListRow = {
  id: 'b1',
  employeeId: 'e1',
  orderId: 'o1',
  projectId: 'p1',
  type: 'SALES',
  amount: '500.00',
  percent: '5',
  status: 'VESTED',
  kpiGatePassed: true,
  payoutMonth: '2026-05',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  employee: { id: 'e1', firstName: 'A', lastName: 'B' },
  order: { id: 'o1', code: 'ORD-1', totalAmount: '10000.00' },
  project: { id: 'p1', code: 'PRJ', name: 'Alpha' },
};

describe('buildBonusBoardCsvContent', () => {
  it('includes header and row with employee and project', () => {
    const csv = buildBonusBoardCsvContent([sampleRow]);
    expect(csv).toContain('employeeName');
    expect(csv).toContain('b1');
    expect(csv).toContain('A B');
    expect(csv).toContain('Alpha');
    expect(csv).toContain('VESTED');
    expect(csv).toContain('true');
  });

  it('returns header only when no rows', () => {
    const csv = buildBonusBoardCsvContent([]);
    expect(csv).toBe(
      'id,employeeId,employeeName,projectId,projectCode,projectName,orderId,orderCode,type,amount,percent,status,kpiGatePassed,payoutMonth,createdAt,updatedAt,salesAccrualHint,salesAccrualInvoiceId',
    );
  });

  it('appends grand total row with summed amount', () => {
    const row2: BonusEntryListRow = {
      ...sampleRow,
      id: 'b2',
      amount: '100.00',
      status: 'PAID',
    };
    const csv = buildBonusBoardCsvContent([sampleRow, row2]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('Visible rows (2)');
    expect(lines[3]).toContain('600.00');
  });
});
