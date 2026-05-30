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
import {
  UnitEconomicsFundingFooter,
  UnitEconomicsOverviewFooter,
} from '@/features/finance/components/unit-economics/unit-economics-table-footer';
import {
  UnitEconomicsTableHead,
  UnitEconomicsTableShell,
} from '@/features/finance/components/unit-economics/unit-economics-table-shell';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import { unitEconomicsOrderRowInteractionProps } from '@/features/finance/components/unit-economics/unit-economics-interactive-row';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function OverviewRowCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  const margin = parseUnitEconomicsMoney(row.marginAfterCommitments);
  const cash = parseUnitEconomicsMoney(row.cashBalance);

  return (
    <>
      <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
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
          amount={parseUnitEconomicsMoney(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
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
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          unitEconomicsMarginClass(cash),
        )}
      >
        {formatAmount(cash)}
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          unitEconomicsMarginClass(margin),
        )}
      >
        {formatAmount(margin)}
      </td>
    </>
  );
}

function FundingRowCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  const overRelease = parseUnitEconomicsMoney(row.overReleaseAmount);
  const cash = parseUnitEconomicsMoney(row.cashBalance);

  return (
    <>
      <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={parseUnitEconomicsMoney(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          unitEconomicsMarginClass(cash),
        )}
      >
        {formatAmount(cash)}
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right tabular-nums',
          overRelease > 0 && 'text-destructive font-medium',
        )}
        title="Released bonuses exceeding received cash on this unit."
      >
        {formatAmount(overRelease)}
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(parseUnitEconomicsMoney(row.outCommittedAmount))}
      </td>
    </>
  );
}

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
        <tr className="text-muted-foreground text-left">
          <th className="border-border border-b px-3 py-2 font-semibold">Order</th>
          {isFunding ? (
            <>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Received
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Cash balance
              </th>
              <th
                className="border-border border-b px-2 py-2 text-right font-semibold"
                title="Released bonuses exceeding received cash."
              >
                Over release
              </th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">
                Out committed
              </th>
            </>
          ) : (
            <>
              <th
                colSpan={2}
                className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
              >
                Money in
              </th>
              <th
                colSpan={3}
                className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
              >
                Money out
              </th>
              <th
                colSpan={2}
                className="border-border border-b px-2 py-2 text-center text-[10px] font-semibold tracking-wide uppercase"
              >
                Balance
              </th>
            </>
          )}
        </tr>
        {!isFunding ? (
          <tr className="text-muted-foreground text-left">
            <th className="border-border border-b px-3 py-2" />
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Received</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">
              To receive
            </th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">
              Bonus to pay
            </th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Committed</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash</th>
            <th className="border-border border-b px-2 py-2 text-right font-semibold">Margin</th>
          </tr>
        ) : null}
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
              {isFunding ? (
                <FundingRowCells row={row} onDrilldown={onDrilldown} />
              ) : (
                <OverviewRowCells row={row} onDrilldown={onDrilldown} />
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
