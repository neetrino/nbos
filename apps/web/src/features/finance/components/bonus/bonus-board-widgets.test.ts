import { describe, expect, it } from 'vitest';
import { uniqueProjectsFromRows } from './bonus-board-widgets';
import type { BonusEntryListRow } from '../../../../lib/api/bonus';

function row(
  partial: Partial<BonusEntryListRow> & Pick<BonusEntryListRow, 'id'>,
): BonusEntryListRow {
  return {
    employeeId: 'e1',
    orderId: 'o1',
    projectId: 'p1',
    type: 'SALES',
    amount: '10',
    percent: '5',
    status: 'ACTIVE',
    kpiGatePassed: null,
    holdbackPercent: null,
    holdbackReleaseDate: null,
    payoutMonth: null,
    createdAt: '',
    updatedAt: '',
    employee: { id: 'e1', firstName: 'A', lastName: 'B' },
    order: { id: 'o1', code: 'ORD-1', totalAmount: '0' },
    project: { id: 'p1', code: 'PR-A', name: 'Alpha' },
    ...partial,
  };
}

describe('uniqueProjectsFromRows', () => {
  it('dedupes by project id and sorts by code', () => {
    const rows = [
      row({ id: 'b1', project: { id: 'p2', code: 'Z', name: 'Zed' } }),
      row({ id: 'b2', project: { id: 'p1', code: 'A', name: 'Alpha' } }),
      row({ id: 'b3', project: { id: 'p1', code: 'A', name: 'Alpha' } }),
    ];
    const list = uniqueProjectsFromRows(rows);
    expect(list.map((x) => x.id)).toEqual(['p1', 'p2']);
    expect(list.at(0)?.label).toContain('Alpha');
  });

  it('returns empty when no projects', () => {
    expect(uniqueProjectsFromRows([])).toEqual([]);
  });
});
