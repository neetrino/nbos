import { describe, it, expect } from 'vitest';
import { Decimal } from '@nbos/database';
import { foldBonusProjectPools, type BonusProjectPoolGroupRow } from './bonus-project-pools';

describe('foldBonusProjectPools', () => {
  const projects = [{ id: 'p1', code: 'PR-1', name: 'Alpha' }];

  it('splits pipeline, paid, and clawback', () => {
    const groupRows: BonusProjectPoolGroupRow[] = [
      { projectId: 'p1', status: 'ACTIVE', _sum: { amount: new Decimal('100') }, _count: 2 },
      { projectId: 'p1', status: 'PAID', _sum: { amount: new Decimal('50') }, _count: 1 },
      { projectId: 'p1', status: 'CLAWBACK', _sum: { amount: new Decimal('10') }, _count: 1 },
    ];
    const rows = foldBonusProjectPools(groupRows, projects);
    expect(rows).toHaveLength(1);
    expect(rows[0].entryCount).toBe(4);
    expect(rows[0].sumPipelineAmount).toBe('100.00');
    expect(rows[0].sumPaidAmount).toBe('50.00');
    expect(rows[0].sumClawbackAmount).toBe('10.00');
    expect(rows[0].sumTotalAmount).toBe('160.00');
  });

  it('sorts by total descending then code', () => {
    const groupRows: BonusProjectPoolGroupRow[] = [
      { projectId: 'p2', status: 'VESTED', _sum: { amount: new Decimal('20') }, _count: 1 },
      { projectId: 'p1', status: 'VESTED', _sum: { amount: new Decimal('99') }, _count: 1 },
    ];
    const rows = foldBonusProjectPools(groupRows, [
      { id: 'p1', code: 'B', name: 'B' },
      { id: 'p2', code: 'A', name: 'A' },
    ]);
    expect(rows.map((r) => r.projectId)).toEqual(['p1', 'p2']);
  });

  it('uses fallback labels when project row missing', () => {
    const groupRows: BonusProjectPoolGroupRow[] = [
      { projectId: 'orphan', status: 'INCOMING', _sum: { amount: new Decimal('1') }, _count: 1 },
    ];
    const rows = foldBonusProjectPools(groupRows, []);
    expect(rows[0].projectCode).toBe('—');
    expect(rows[0].projectName).toBe('Unknown project');
  });
});
