'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { useUnitEconomicsList } from '@/features/finance/hooks/use-unit-economics-list';
import { UnitEconomicsTotalsBar } from '@/features/finance/components/unit-economics/unit-economics-totals-bar';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';

export function UnitEconomicsExpensesTable() {
  const { items, totals, loading, error, reload } = useUnitEconomicsList();

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => Number.parseFloat(b.expensesPaidAmount) - Number.parseFloat(a.expensesPaidAmount),
      ),
    [items],
  );

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <div className="flex flex-col gap-3">
      {totals ? <UnitEconomicsTotalsBar totals={totals} /> : null}
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table className="w-full min-w-[44rem] border-collapse text-xs">
          <thead className="bg-card sticky top-0 z-10">
            <tr className="text-muted-foreground text-left">
              <th className="border-border border-b px-3 py-2 font-semibold">Delivery unit</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Expenses
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Planned</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Released
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
                  No delivery units with expenses yet.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.orderId} className="hover:bg-muted/30">
                  <UnitEconomicsUnitLinkCell row={row} />
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.expensesPaidAmount))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.plannedBonuses))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.releasedBonuses))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.remainingBonuses))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
