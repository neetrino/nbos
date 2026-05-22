import { describe, expect, it } from 'vitest';
import { computeBonusBoardFilteredTotals } from './bonus-board-filtered-totals';
import type { BonusEntryListRow } from '@/lib/api/bonus';

function row(amount: string): BonusEntryListRow {
  return {
    id: 'b1',
    employeeId: 'e1',
    orderId: 'o1',
    projectId: 'p1',
    type: 'SALES',
    amount,
    percent: '0',
    status: 'ACTIVE',
    kpiGatePassed: null,
    payoutMonth: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    employee: { id: 'e1', firstName: 'A', lastName: 'B' },
    order: { id: 'o1', code: 'O-1' },
    project: { id: 'p1', code: 'P', name: 'Proj' },
  };
}

describe('computeBonusBoardFilteredTotals', () => {
  it('sums entry amounts', () => {
    expect(computeBonusBoardFilteredTotals([row('100'), row('50.5')])).toEqual({
      entryCount: 2,
      totalAmount: 150.5,
    });
  });
});
