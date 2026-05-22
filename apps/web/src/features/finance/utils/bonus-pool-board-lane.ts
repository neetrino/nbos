import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { bonusPoolHasOverFunding } from '@/features/finance/constants/bonus-pool-status-ui';
import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';

export type BonusPoolBoardLane = 'over' | 'at_risk' | 'partial' | 'ready';

export const BONUS_POOL_BOARD_LANE_ORDER: BonusPoolBoardLane[] = [
  'at_risk',
  'partial',
  'ready',
  'over',
];

export const BONUS_POOL_BOARD_LANE_LABEL: Record<BonusPoolBoardLane, string> = {
  at_risk: 'At risk',
  partial: 'Partial release',
  ready: 'Ready',
  over: 'Over funding',
};

export function bonusPoolBoardLane(row: BonusProductPoolRow): BonusPoolBoardLane {
  if (bonusPoolHasOverFunding(row) || row.fundingHealth === 'OVER') {
    return 'over';
  }
  const health = row.fundingHealth;
  if (health === 'EMPTY') return 'at_risk';
  if (health === 'PARTIAL') return 'partial';
  if (health === 'READY' || health === 'CLOSED') return 'ready';

  const status = row.ledgerPoolStatus?.toUpperCase() ?? '';
  const available = parseBonusPoolAmount(row.ledgerAvailableFunding);
  const remaining = parseBonusPoolAmount(row.ledgerRemainingAmount);
  const released = parseBonusPoolAmount(row.ledgerReleasedAmount);

  if (!row.ledgerPoolStatus) {
    return 'at_risk';
  }
  if (status === 'CLOSED' || remaining <= 0) {
    return 'ready';
  }
  if (status === 'PARTIALLY_RELEASED' || released > 0) {
    return 'partial';
  }
  if (available > 0 && remaining > 0) {
    return 'ready';
  }
  return 'at_risk';
}

export function groupPoolsByBoardLane(
  rows: BonusProductPoolRow[],
): Record<BonusPoolBoardLane, BonusProductPoolRow[]> {
  const lanes: Record<BonusPoolBoardLane, BonusProductPoolRow[]> = {
    at_risk: [],
    partial: [],
    ready: [],
    over: [],
  };
  for (const row of rows) {
    lanes[bonusPoolBoardLane(row)].push(row);
  }
  for (const lane of BONUS_POOL_BOARD_LANE_ORDER) {
    lanes[lane].sort((a, b) => a.poolName.localeCompare(b.poolName));
  }
  return lanes;
}
