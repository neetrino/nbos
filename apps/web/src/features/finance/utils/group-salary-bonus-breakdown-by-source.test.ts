import { describe, expect, it } from 'vitest';
import { groupSalaryBonusBreakdownBySource } from './group-salary-bonus-breakdown-by-source';
import type { SalaryLineMonthBonusRow } from '@/lib/api/payroll-runs';

const baseRow = (overrides: Partial<SalaryLineMonthBonusRow>): SalaryLineMonthBonusRow => ({
  bonusEntryId: 'e1',
  bonusReleaseId: 'r1',
  type: 'DELIVERY',
  releaseType: 'AUTO',
  releaseStatus: 'INCLUDED_IN_PAYROLL',
  projectId: 'p1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  orderCode: 'ORD-1',
  productLabel: 'Website',
  plannedAmount: '1000',
  releaseAmount: '400',
  includedAmount: '400',
  kpiBurnedAmount: null,
  paidAmount: '0',
  remainingAmount: '600',
  reason: null,
  ...overrides,
});

describe('groupSalaryBonusBreakdownBySource', () => {
  it('dedupes planned per entry and sums releases', () => {
    const groups = groupSalaryBonusBreakdownBySource([
      baseRow({ bonusReleaseId: 'r1', releaseAmount: '300', includedAmount: '300' }),
      baseRow({
        bonusReleaseId: 'r2',
        releaseAmount: '100',
        includedAmount: '100',
        paidAmount: '50',
        remainingAmount: '550',
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.planned).toBe(1000);
    expect(groups[0]?.released).toBe(400);
    expect(groups[0]?.included).toBe(400);
    expect(groups[0]?.paid).toBe(50);
    expect(groups[0]?.releaseCount).toBe(2);
  });

  it('sums persisted kpi burned per source group', () => {
    const groups = groupSalaryBonusBreakdownBySource([
      baseRow({ kpiBurnedAmount: '30' }),
      baseRow({ bonusReleaseId: 'r2', kpiBurnedAmount: '20', releaseAmount: '50' }),
    ]);
    expect(groups[0]?.burned).toBe(50);
  });
});
