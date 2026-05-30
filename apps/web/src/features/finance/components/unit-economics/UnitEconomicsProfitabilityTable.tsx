'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import {
  parseUnitEconomicsMoney,
  parseUnitEconomicsSpent,
  unitEconomicsMarginClass,
} from '@/features/finance/components/unit-economics/unit-economics-money';
import { UnitEconomicsProfitabilityFooter } from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';
import { unitEconomicsOrderRowInteractionProps } from '@/features/finance/components/unit-economics/unit-economics-interactive-row';
import { cn } from '@/lib/utils';

export function UnitEconomicsProfitabilityTable({
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
          parseUnitEconomicsMoney(b.marginAfterCommitments) -
          parseUnitEconomicsMoney(a.marginAfterCommitments),
      ),
    [items],
  );

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <UnitEconomicsTableShell
      minWidth="min-w-[56rem]"
      hint={
        <p className="text-muted-foreground text-sm">
          Margin after commitments vs cash margin. Click a row to open the unit sheet, or an amount
          cell for a specific tab.
        </p>
      }
    >
      <UnitEconomicsTableHead>
        <tr className="text-muted-foreground text-left">
          <th className="border-border border-b px-3 py-2 font-semibold">Delivery unit</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Margin (after commitments)
          </th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash margin</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Received</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Bonus to pay
          </th>
          <th className="border-border border-b px-2 py-2 text-right font-semibold">
            Out committed
          </th>
        </tr>
      </UnitEconomicsTableHead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
              No delivery units with margin data yet.
            </td>
          </tr>
        ) : (
          sorted.map((row) => {
            const margin = parseUnitEconomicsMoney(row.marginAfterCommitments);
            const cashMargin = parseUnitEconomicsMoney(row.marginFact);
            return (
              <tr
                key={row.orderId}
                {...unitEconomicsOrderRowInteractionProps({
                  orderId: row.orderId,
                  isActive: activeOrderId === row.orderId,
                  onDrilldown,
                })}
              >
                <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
                <td
                  className={cn(
                    'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
                    unitEconomicsMarginClass(margin),
                  )}
                >
                  {formatAmount(margin)}
                </td>
                <td
                  className={cn(
                    'border-border border-b px-2 py-2 text-right tabular-nums',
                    unitEconomicsMarginClass(cashMargin),
                  )}
                >
                  {formatAmount(cashMargin)}
                </td>
                <td className="border-border border-b px-2 py-2 text-right">
                  <UnitEconomicsDrilldownAmount
                    amount={parseUnitEconomicsMoney(row.receivedAmount)}
                    orderId={row.orderId}
                    focus="payments"
                    onDrilldown={onDrilldown}
                  />
                </td>
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
              </tr>
            );
          })
        )}
        {sorted.length > 0 ? <UnitEconomicsProfitabilityFooter totals={filteredTotals} /> : null}
      </tbody>
    </UnitEconomicsTableShell>
  );
}
