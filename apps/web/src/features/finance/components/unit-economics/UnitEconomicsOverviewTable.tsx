'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { parseUnitEconomicsMoney } from '@/features/finance/components/unit-economics/unit-economics-money';
import {
  UnitEconomicsFundingMoneyCells,
  UnitEconomicsOverviewMoneyCells,
} from '@/features/finance/components/unit-economics/unit-economics-row-money-cells';
import {
  UnitEconomicsFundingFooter,
  UnitEconomicsOverviewFooter,
} from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import {
  UnitEconomicsFundingHeaderRow,
  UnitEconomicsOverviewMoneyHeaderRow,
} from '@/features/finance/components/unit-economics/unit-economics-table-headers';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import { unitEconomicsOrderRowInteractionProps } from '@/features/finance/components/unit-economics/unit-economics-interactive-row';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

export function UnitEconomicsOverviewTable({
  data,
  items,
  variant = 'overview',
  activeOrderId = null,
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsRow[];
  variant?: 'overview' | 'funding';
  activeOrderId?: string | null;
  onDrilldown?: DrilldownHandler;
}) {
  const { loading, error, reload, filteredTotals } = data;

  const displayItems = useMemo(() => {
    if (variant !== 'funding') return items;
    return [...items].sort(
      (a, b) => parseUnitEconomicsMoney(b.cashBalance) - parseUnitEconomicsMoney(a.cashBalance),
    );
  }, [items, variant]);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  const isFunding = variant === 'funding';

  return (
    <UnitEconomicsTableShell
      minWidth={isFunding ? 'min-w-[44rem]' : 'min-w-[56rem]'}
      hint={
        isFunding ? (
          <p className="text-muted-foreground text-sm">
            Cash balance and over-release risk per delivery unit. Over release flags when released
            bonuses exceed received cash.
          </p>
        ) : null
      }
    >
      <UnitEconomicsTableHead>
        {isFunding ? (
          <UnitEconomicsFundingHeaderRow />
        ) : (
          <UnitEconomicsOverviewMoneyHeaderRow labelColumn="Order" />
        )}
      </UnitEconomicsTableHead>
      <tbody>
        {displayItems.length === 0 ? (
          <tr>
            <td colSpan={isFunding ? 5 : 8} className="text-muted-foreground px-3 py-8 text-center">
              No delivery units with financial activity yet.
            </td>
          </tr>
        ) : (
          displayItems.map((row) => (
            <tr
              key={row.orderId}
              {...unitEconomicsOrderRowInteractionProps({
                orderId: row.orderId,
                isActive: activeOrderId === row.orderId,
                onDrilldown,
              })}
            >
              <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
              {isFunding ? (
                <UnitEconomicsFundingMoneyCells row={row} onDrilldown={onDrilldown} />
              ) : (
                <UnitEconomicsOverviewMoneyCells row={row} onDrilldown={onDrilldown} />
              )}
            </tr>
          ))
        )}
        {displayItems.length > 0 ? (
          isFunding ? (
            <UnitEconomicsFundingFooter totals={filteredTotals} />
          ) : (
            <UnitEconomicsOverviewFooter totals={filteredTotals} />
          )
        ) : null}
      </tbody>
    </UnitEconomicsTableShell>
  );
}
