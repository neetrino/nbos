'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { useUnitEconomicsList } from '@/features/finance/hooks/use-unit-economics-list';
import { UnitEconomicsTotalsBar } from '@/features/finance/components/unit-economics/unit-economics-totals-bar';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

export function UnitEconomicsExpensesTable({
  onDrilldown,
}: {
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
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
                  <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
                  <td className="border-border border-b px-2 py-2 text-right">
                    <UnitEconomicsDrilldownAmount
                      amount={Number.parseFloat(row.expensesPaidAmount)}
                      orderId={row.orderId}
                      focus="expenses"
                      onDrilldown={onDrilldown}
                    />
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right">
                    <UnitEconomicsDrilldownAmount
                      amount={Number.parseFloat(row.plannedBonuses)}
                      orderId={row.orderId}
                      focus="bonuses"
                      onDrilldown={onDrilldown}
                    />
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
