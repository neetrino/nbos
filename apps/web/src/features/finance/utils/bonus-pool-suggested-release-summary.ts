import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import {
  bonusPoolFundedAmount,
  bonusPoolReleaseBudget,
} from '@/features/finance/utils/bonus-pool-display-metrics';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

export type BonusPoolSuggestedReleaseSummary = {
  suggestedTotal: number;
  fundedPool: number;
  releaseBudget: number;
  releasableNow: number;
  exceedsBudget: boolean;
  employeeCountWithSuggestion: number;
};

export function summarizeBonusPoolSuggestedReleases(
  pool: BonusProductPoolRow,
  lines: readonly BonusPoolEmployeeLine[],
): BonusPoolSuggestedReleaseSummary {
  let suggestedTotal = 0;
  let employeeCountWithSuggestion = 0;

  for (const line of lines) {
    const suggested = parseBonusPoolAmount(line.suggestedReleaseAmount);
    if (suggested <= 0) continue;
    suggestedTotal += suggested;
    employeeCountWithSuggestion += 1;
  }

  const fundedPool = bonusPoolFundedAmount(pool);
  const releaseBudget = bonusPoolReleaseBudget(pool);
  const releasableNow = Math.min(suggestedTotal, releaseBudget);

  return {
    suggestedTotal,
    fundedPool,
    releaseBudget,
    releasableNow,
    exceedsBudget: suggestedTotal > releaseBudget && releaseBudget >= 0,
    employeeCountWithSuggestion,
  };
}
