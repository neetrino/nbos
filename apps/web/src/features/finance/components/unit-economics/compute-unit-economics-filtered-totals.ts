import type { UnitEconomicsRow } from '@/lib/api/unit-economics';
import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
} from '@/features/finance/components/unit-economics/unit-economics-money';

export type UnitEconomicsFilteredTotals = {
  unitCount: number;
  receivedAmount: number;
  receivableAmount: number;
  spentAmount: number;
  remainingBonuses: number;
  outCommittedAmount: number;
  cashBalance: number;
  marginAfterCommitments: number;
  marginFact: number;
  paidBonuses: number;
  overReleaseAmount: number;
};

function sumItems(items: UnitEconomicsRow[], pick: (row: UnitEconomicsRow) => number): number {
  return items.reduce((acc, row) => acc + pick(row), 0);
}

/** Roll-up money fields for the currently filtered delivery units. */
export function computeUnitEconomicsFilteredTotals(
  items: UnitEconomicsRow[],
): UnitEconomicsFilteredTotals {
  return {
    unitCount: items.length,
    receivedAmount: sumItems(items, (row) => parseUnitEconomicsMoney(row.receivedAmount)),
    receivableAmount: sumItems(items, (row) => parseUnitEconomicsMoney(row.receivableAmount)),
    spentAmount: sumItems(items, (row) => parseUnitEconomicsSpent(row)),
    remainingBonuses: sumItems(items, (row) => parseUnitEconomicsMoney(row.remainingBonuses)),
    outCommittedAmount: sumItems(items, (row) => parseUnitEconomicsMoney(row.outCommittedAmount)),
    cashBalance: sumItems(items, (row) => parseUnitEconomicsMoney(row.cashBalance)),
    marginAfterCommitments: sumItems(items, (row) =>
      parseUnitEconomicsMoney(row.marginAfterCommitments),
    ),
    marginFact: sumItems(items, (row) => parseUnitEconomicsMoney(row.marginFact)),
    paidBonuses: sumItems(items, (row) => parseUnitEconomicsMoney(row.paidBonuses)),
    overReleaseAmount: sumItems(items, (row) => parseUnitEconomicsMoney(row.overReleaseAmount)),
  };
}
