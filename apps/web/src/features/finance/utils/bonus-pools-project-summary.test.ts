import { describe, expect, it } from 'vitest';
import { summarizeBonusPoolsProjectGroup } from './bonus-pools-project-summary';
import type { BonusPoolsProjectGroup } from './bonus-pools-grouping';

const basePool = {
  poolKey: 'product:p1',
  poolKind: 'PRODUCT' as const,
  anchorOrderId: 'o1',
  poolName: 'Site',
  orderCode: 'ORD-1',
  projectId: 'proj1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 2,
  sumTotalAmount: '100',
  sumPipelineAmount: '50',
  sumPaidAmount: '50',
  sumClawbackAmount: '0',
  ledgerPlannedAmount: '100',
  ledgerReleasedAmount: '40',
  ledgerRemainingAmount: '60',
  ledgerAvailableFunding: '10',
  ledgerOverFundingAmount: '0',
  ledgerReceivedAmount: '50',
  ledgerPoolStatus: 'PARTIALLY_RELEASED',
  orderIds: ['o1'],
  orderCodes: ['ORD-1'],
  employeeCount: 3,
  fundingFillPercent: 50,
  fundingHealth: 'PARTIAL' as const,
};

describe('summarizeBonusPoolsProjectGroup', () => {
  it('sums money and team count across pools in a project', () => {
    const group: BonusPoolsProjectGroup = {
      projectId: 'proj1',
      projectCode: 'PRJ',
      projectName: 'Alpha',
      pools: [
        basePool,
        {
          ...basePool,
          poolKey: 'extension:ex1',
          poolKind: 'EXTENSION',
          poolName: 'Add-on',
          employeeCount: 2,
          ledgerPlannedAmount: '50',
          ledgerReceivedAmount: '20',
          ledgerRemainingAmount: '30',
        },
      ],
    };
    const summary = summarizeBonusPoolsProjectGroup(group);
    expect(summary.poolCount).toBe(2);
    expect(summary.teamCount).toBe(5);
    expect(summary.planned).toBe(150);
    expect(summary.received).toBe(70);
    expect(summary.remaining).toBe(90);
  });
});
