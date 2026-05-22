import { describe, expect, it } from 'vitest';
import { groupBonusEntriesByPayrollMonth } from './bonus-board-grouping';
import type { BonusEntryListRow } from '@/lib/api/bonus';

function entry(payoutMonth: string | null): BonusEntryListRow {
  return {
    id: `e-${payoutMonth ?? 'none'}`,
    employeeId: 'emp-1',
    orderId: 'ord-1',
    projectId: 'proj-1',
    type: 'SALES',
    status: 'ACTIVE',
    amount: '100',
    percent: '0',
    kpiGatePassed: null,
    payoutMonth,
    employee: { id: 'emp-1', firstName: 'A', lastName: 'B' },
    order: { id: 'ord-1', code: 'O-1' },
    project: { id: 'proj-1', code: 'P', name: 'Proj' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('groupBonusEntriesByPayrollMonth', () => {
  it('sorts month labels and places unscheduled last', () => {
    const groups = groupBonusEntriesByPayrollMonth([
      entry(null),
      entry('2026-03'),
      entry('2026-01'),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['2026-01', '2026-03', 'No payroll month']);
    expect(groups.at(-1)?.entries).toHaveLength(1);
  });
});
