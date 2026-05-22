import { describe, expect, it } from 'vitest';
import { bonusPoolBoardLane } from './bonus-pool-board-lane';
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
  sumTotalAmount: '100',
  sumPipelineAmount: '100',
  sumPaidAmount: '0',
  sumClawbackAmount: '0',
  ledgerPlannedAmount: '100',
  ledgerReleasedAmount: '50',
  ledgerRemainingAmount: '50',
  ledgerAvailableFunding: '10',
  ledgerOverFundingAmount: null,
  ledgerReceivedAmount: '60',
  ledgerPoolStatus: 'PARTIALLY_RELEASED',
};

describe('bonusPoolBoardLane', () => {
  it('routes over funding to over lane', () => {
    expect(
      bonusPoolBoardLane({ ...base, ledgerOverFundingAmount: '5.00', ledgerPoolStatus: 'ACTIVE' }),
    ).toBe('over');
  });

  it('routes partial status to partial lane', () => {
    expect(bonusPoolBoardLane(base)).toBe('partial');
  });
});
