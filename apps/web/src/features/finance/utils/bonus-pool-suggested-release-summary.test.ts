import { describe, expect, it } from 'vitest';
import { summarizeBonusPoolSuggestedReleases } from './bonus-pool-suggested-release-summary';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

const pool: BonusProductPoolRow = {
  poolKey: 'product:p1',
  poolKind: 'PRODUCT',
  anchorOrderId: 'o1',
  poolName: 'Site',
  orderCode: 'ORD-1',
  projectId: 'p1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 2,
  sumTotalAmount: '200',
  sumPipelineAmount: '200',
  sumPaidAmount: '0',
  sumClawbackAmount: '0',
  ledgerPlannedAmount: '200',
  ledgerReleasedAmount: '0',
  ledgerRemainingAmount: '200',
  ledgerAvailableFunding: '80',
  ledgerOverFundingAmount: '0',
  ledgerReceivedAmount: '80',
  ledgerPoolStatus: 'ACTIVE',
  orderIds: ['o1'],
  orderCodes: ['ORD-1'],
  employeeCount: 2,
  fundingFillPercent: 40,
  fundingHealth: 'PARTIAL',
};

const line = (suggested: string): BonusPoolEmployeeLine => ({
  employeeId: 'e1',
  employeeName: 'Jane',
  role: null,
  bonusTypes: ['SALES'],
  entryCount: 1,
  plannedAmount: '100',
  pipelineAmount: '100',
  releasedAmount: '0',
  includedInPayrollAmount: '0',
  paidAmount: '0',
  remainingAmount: '100',
  burnedAmount: null,
  carryOverAmount: null,
  suggestedReleaseAmount: suggested,
  kpiGatePassed: null,
  primaryStatus: 'ACTIVE',
});

describe('summarizeBonusPoolSuggestedReleases', () => {
  it('caps releasable now at bonus release budget', () => {
    const summary = summarizeBonusPoolSuggestedReleases(pool, [line('60'), line('50')]);
    expect(summary.suggestedTotal).toBe(110);
    expect(summary.fundedPool).toBe(80);
    expect(summary.releaseBudget).toBe(80);
    expect(summary.releasableNow).toBe(80);
    expect(summary.exceedsBudget).toBe(true);
  });

  it('does not use raw client cash above planned bonus pool', () => {
    const richPool: BonusProductPoolRow = {
      ...pool,
      ledgerPlannedAmount: '125000',
      ledgerRemainingAmount: '62500',
      ledgerAvailableFunding: '2437500',
      ledgerReceivedAmount: '2500000',
      fundingFillPercent: 100,
      fundingHealth: 'READY',
    };
    const summary = summarizeBonusPoolSuggestedReleases(richPool, [line('70000')]);
    expect(summary.releaseBudget).toBe(62500);
    expect(summary.releasableNow).toBe(62500);
    expect(summary.exceedsBudget).toBe(true);
  });
});
