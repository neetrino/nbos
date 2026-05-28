'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import type { UnitEconomicsRow } from '@/lib/api/unit-economics';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

export function UnitEconomicsExpensesTable({
  data,
  items,
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsRow[];
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
  const { loading, error, reload } = data;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => Number.parseFloat(b.outCommittedAmount) - Number.parseFloat(a.outCommittedAmount),
      ),
    [items],
  );

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table className="w-full min-w-[44rem] border-collapse text-xs">
          <thead className="bg-card sticky top-0 z-10">
            <tr className="text-muted-foreground text-left">
              <th className="border-border border-b px-3 py-2 font-semibold">Delivery unit</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Bonus to pay
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Out committed
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Bonus paid
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
                  No delivery units with outflows yet.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.orderId} className="hover:bg-muted/30">
                  <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
                  <td className="border-border border-b px-2 py-2 text-right">
                    <UnitEconomicsDrilldownAmount
                      amount={Number.parseFloat(row.outFactAmount)}
                      orderId={row.orderId}
                      focus="expenses"
                      onDrilldown={onDrilldown}
                    />
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right">
                    <UnitEconomicsDrilldownAmount
                      amount={Number.parseFloat(row.remainingBonuses)}
                      orderId={row.orderId}
                      focus="bonuses"
                      onDrilldown={onDrilldown}
                    />
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.outCommittedAmount))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(Number.parseFloat(row.paidBonuses))}
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
