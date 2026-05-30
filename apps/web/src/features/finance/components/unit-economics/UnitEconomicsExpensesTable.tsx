'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
} from '@/features/finance/components/unit-economics/unit-economics-money';
import { UnitEconomicsOutflowsFooter } from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import { unitEconomicsOrderRowInteractionProps } from '@/features/finance/components/unit-economics/unit-economics-interactive-row';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';

export function UnitEconomicsExpensesTable({
  data,
  items,
  activeOrderId = null,
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsBoardData['items'];
  activeOrderId?: string | null;
  onDrilldown?: (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;
}) {
  const { loading, error, reload, filteredTotals } = data;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          parseUnitEconomicsMoney(b.outCommittedAmount) -
          parseUnitEconomicsMoney(a.outCommittedAmount),
      ),
    [items],
  );

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <UnitEconomicsTableShell
      minWidth="min-w-[44rem]"
      hint={
        <p className="text-muted-foreground text-sm">
          Money out per delivery unit. Click a row to open the unit sheet, or a amount cell for a
          specific tab.
        </p>
      }
    >
      <UnitEconomicsTableHead>
        <tr className="text-muted-foreground text-left">
          <th className="border-border border-b px-3 py-2 font-semibold">Delivery unit</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Bonus to pay
          </th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Out committed
          </th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Bonus paid</th>
        </tr>
      </UnitEconomicsTableHead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-muted-foreground px-3 py-8 text-center">
              No delivery units with outflows yet.
            </td>
          </tr>
        ) : (
          sorted.map((row) => (
            <tr
              key={row.orderId}
              {...unitEconomicsOrderRowInteractionProps({
                orderId: row.orderId,
                isActive: activeOrderId === row.orderId,
                onDrilldown,
              })}
            >
              <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
              <td className="border-border border-b px-2 py-2 text-right">
                <UnitEconomicsDrilldownAmount
                  amount={parseUnitEconomicsSpent(row)}
                  orderId={row.orderId}
                  focus="expenses"
                  onDrilldown={onDrilldown}
                />
              </td>
              <td className="border-border border-b px-2 py-2 text-right">
                <UnitEconomicsDrilldownAmount
                  amount={parseUnitEconomicsMoney(row.remainingBonuses)}
                  orderId={row.orderId}
                  focus="bonuses"
                  onDrilldown={onDrilldown}
                />
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(parseUnitEconomicsMoney(row.outCommittedAmount))}
              </td>
              <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                {formatAmount(parseUnitEconomicsMoney(row.paidBonuses))}
              </td>
            </tr>
          ))
        )}
        {sorted.length > 0 ? <UnitEconomicsOutflowsFooter totals={filteredTotals} /> : null}
      </tbody>
    </UnitEconomicsTableShell>
  );
}
