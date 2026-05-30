'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { parseUnitEconomicsMoney } from '@/features/finance/components/unit-economics/unit-economics-money';
import { UnitEconomicsProfitabilityMoneyCells } from '@/features/finance/components/unit-economics/unit-economics-row-money-cells';
import { UnitEconomicsProfitabilityFooter } from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import { UnitEconomicsProfitabilityHeaderRow } from '@/features/finance/components/unit-economics/unit-economics-table-headers';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import type { UnitEconomicsDrilldownFocus } from '@/lib/api/unit-economics';
import { unitEconomicsOrderRowInteractionProps } from '@/features/finance/components/unit-economics/unit-economics-interactive-row';

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
        <UnitEconomicsProfitabilityHeaderRow />
      </UnitEconomicsTableHead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-muted-foreground px-3 py-8 text-center">
              No delivery units with margin data yet.
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
              <UnitEconomicsProfitabilityMoneyCells row={row} onDrilldown={onDrilldown} />
            </tr>
          ))
        )}
        {sorted.length > 0 ? <UnitEconomicsProfitabilityFooter totals={filteredTotals} /> : null}
      </tbody>
    </UnitEconomicsTableShell>
  );
}
