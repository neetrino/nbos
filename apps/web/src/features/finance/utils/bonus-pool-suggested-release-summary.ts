import { parseBonusPoolAmount } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

export type BonusPoolSuggestedReleaseSummary = {
  suggestedTotal: number;
  availableFunding: number;
  releasableNow: number;
  exceedsAvailable: boolean;
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

  const availableFunding = parseBonusPoolAmount(pool.ledgerAvailableFunding);
  const releasableNow = Math.min(suggestedTotal, availableFunding);

  return {
    suggestedTotal,
    availableFunding,
    releasableNow,
    exceedsAvailable: suggestedTotal > availableFunding && availableFunding >= 0,
    employeeCountWithSuggestion,
  };
}
