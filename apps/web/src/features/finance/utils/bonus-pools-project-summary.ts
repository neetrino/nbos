import type { BonusPoolsProjectGroup } from '@/features/finance/utils/bonus-pools-grouping';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';

export type BonusPoolsProjectSummary = {
  poolCount: number;
  teamCount: number;
  received: number;
  planned: number;
  remaining: number;
  available: number;
  overFundingPools: number;
};

export function summarizeBonusPoolsProjectGroup(
  group: BonusPoolsProjectGroup,
): BonusPoolsProjectSummary {
  let received = 0;
  let planned = 0;
  let remaining = 0;
  let available = 0;
  let teamCount = 0;
  let overFundingPools = 0;

  for (const pool of group.pools) {
    received += parseBonusPoolAmount(pool.ledgerReceivedAmount);
    planned += parseBonusPoolAmount(pool.ledgerPlannedAmount);
    remaining += parseBonusPoolAmount(pool.ledgerRemainingAmount);
    available += parseBonusPoolAmount(pool.ledgerAvailableFunding);
    teamCount += pool.employeeCount;
    if (parseBonusPoolAmount(pool.ledgerOverFundingAmount) > 0) {
      overFundingPools += 1;
    }
  }

  return {
    poolCount: group.pools.length,
    teamCount,
    received,
    planned,
    remaining,
    available,
    overFundingPools,
  };
}
