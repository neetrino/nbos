import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import {
  bonusPoolFundedAmount,
  bonusPoolReleasableAmount,
} from '@/features/finance/utils/bonus-pool-display-metrics';
import { bonusPoolHasOverFunding } from '@/features/finance/constants/bonus-pool-status-ui';

export type BonusPoolsFilteredTotals = {
  poolCount: number;
  entryCount: number;
  planned: number;
  released: number;
  paid: number;
  funded: number;
  releasable: number;
  overFundingPools: number;
};

export function computeBonusPoolsFilteredTotals(
  rows: ReadonlyArray<BonusProductPoolRow>,
): BonusPoolsFilteredTotals {
  let entryCount = 0;
  let planned = 0;
  let released = 0;
  let paid = 0;
  let funded = 0;
  let releasable = 0;
  let overFundingPools = 0;

  for (const row of rows) {
    entryCount += row.entryCount;
    planned += parseBonusPoolAmount(row.ledgerPlannedAmount);
    released += parseBonusPoolAmount(row.ledgerReleasedAmount);
    paid += parseBonusPoolAmount(row.sumPaidAmount);
    funded += bonusPoolFundedAmount(row);
    releasable += bonusPoolReleasableAmount(row);
    if (bonusPoolHasOverFunding(row)) {
      overFundingPools += 1;
    }
  }

  return {
    poolCount: rows.length,
    entryCount,
    planned,
    released,
    paid,
    funded,
    releasable,
    overFundingPools,
  };
}
