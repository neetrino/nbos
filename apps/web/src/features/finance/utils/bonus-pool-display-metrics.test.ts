import { describe, expect, it } from 'vitest';
import {
  bonusPoolFundedAmount,
  bonusPoolFundingFillPercent,
  bonusPoolReleasableAmount,
} from '@/features/finance/utils/bonus-pool-display-metrics';
import type { BonusProductPoolRow } from '@/lib/api/bonus';

const base: BonusProductPoolRow = {
  poolKey: 'product:p1',
  poolKind: 'PRODUCT',
  anchorOrderId: 'ord-1',
  poolName: 'Website',
  orderCode: 'ORD-1',
  projectId: 'proj1',
  projectCode: 'PRJ',
  projectName: 'Alpha',
  entryCount: 1,
  sumTotalAmount: '125000',
  sumPipelineAmount: '62500',
  sumPaidAmount: '0',
  sumClawbackAmount: '0',
  ledgerPlannedAmount: '125000',
  ledgerReleasedAmount: '62500',
  ledgerRemainingAmount: '62500',
  ledgerAvailableFunding: '2437500',
  ledgerOverFundingAmount: '0',
  ledgerReceivedAmount: '2500000',
  ledgerPoolStatus: 'PARTIALLY_RELEASED',
  orderIds: ['ord-1'],
  orderCodes: ['ORD-1'],
  employeeCount: 2,
  fundingFillPercent: 100,
  fundingHealth: 'READY',
};

describe('bonusPoolDisplayMetrics', () => {
  it('caps funded amount at planned', () => {
    expect(bonusPoolFundedAmount(base)).toBe(125_000);
  });

  it('computes releasable as min(remaining, funded)', () => {
    expect(bonusPoolReleasableAmount(base)).toBe(62_500);
  });

  it('caps fill percent at 100', () => {
    expect(bonusPoolFundingFillPercent({ ...base, fundingFillPercent: 2000 })).toBe(100);
  });
});
