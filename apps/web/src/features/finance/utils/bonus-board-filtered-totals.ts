import { parseBonusAmount } from '@/features/finance/components/bonus/bonus-board-widgets';
import type { BonusEntryListRow } from '@/lib/api/bonus';

export type BonusBoardFilteredTotals = {
  entryCount: number;
  totalAmount: number;
};

export function computeBonusBoardFilteredTotals(
  rows: ReadonlyArray<BonusEntryListRow>,
): BonusBoardFilteredTotals {
  let totalAmount = 0;
  for (const row of rows) {
    totalAmount += parseBonusAmount(row.amount);
  }
  return { entryCount: rows.length, totalAmount };
}
