'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsList } from '@/lib/api/unit-economics';

export function UnitEconomicsTotalsBar({ totals }: { totals: UnitEconomicsList['totals'] }) {
  return (
    <div className="text-muted-foreground flex flex-wrap gap-4 text-xs tabular-nums">
      <span>Invoiced {formatAmount(Number.parseFloat(totals.invoicedAmount))}</span>
      <span>Received {formatAmount(Number.parseFloat(totals.receivedAmount))}</span>
      <span>Receivable {formatAmount(Number.parseFloat(totals.receivableAmount))}</span>
      <span>Expenses {formatAmount(Number.parseFloat(totals.expensesPaidAmount))}</span>
      <span>Planned bonuses {formatAmount(Number.parseFloat(totals.plannedBonuses))}</span>
      <span>Available cash {formatAmount(Number.parseFloat(totals.availableCash))}</span>
    </div>
  );
}
