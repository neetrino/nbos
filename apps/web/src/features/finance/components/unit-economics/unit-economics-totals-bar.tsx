'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsList } from '@/lib/api/unit-economics';

export function UnitEconomicsTotalsBar({ totals }: { totals: UnitEconomicsList['totals'] }) {
  return (
    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
      <span className="text-foreground font-medium">In</span>
      <span>Received {formatAmount(Number.parseFloat(totals.receivedAmount))}</span>
      <span>Still to receive {formatAmount(Number.parseFloat(totals.receivableAmount))}</span>
      <span className="text-foreground ml-2 font-medium">Out</span>
      <span>Spent {formatAmount(Number.parseFloat(totals.expensesPaidAmount))}</span>
      <span>Bonus plan {formatAmount(Number.parseFloat(totals.plannedBonuses))}</span>
      <span>Committed {formatAmount(Number.parseFloat(totals.outCommittedAmount))}</span>
      <span className="text-foreground ml-2 font-medium">Balance</span>
      <span>Cash {formatAmount(Number.parseFloat(totals.cashBalance))}</span>
    </div>
  );
}
