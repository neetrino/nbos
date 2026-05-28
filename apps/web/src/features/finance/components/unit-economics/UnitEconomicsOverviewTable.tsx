'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
import { UnitEconomicsUnitLinkCell } from '@/features/finance/components/unit-economics/unit-economics-unit-link-cell';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

type DrilldownHandler = (orderId: string, focus: UnitEconomicsDrilldownFocus) => void;

function marginClass(margin: number): string {
  if (margin < 0) return 'text-destructive';
  if (margin > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function OverviewRowCells({
  row,
  onDrilldown,
}: {
  row: UnitEconomicsRow;
  onDrilldown?: DrilldownHandler;
}) {
  const margin = Number.parseFloat(row.marginAfterCommitments);
  return (
    <>
      <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
      </td>
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.receivableAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
      </td>
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
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          marginClass(Number.parseFloat(row.cashBalance)),
        )}
      >
        {formatAmount(Number.parseFloat(row.cashBalance))}
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          marginClass(margin),
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
  const overRelease = Number.parseFloat(row.overReleaseAmount);
  const cash = Number.parseFloat(row.cashBalance);
  return (
    <>
      <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.receivedAmount)}
          orderId={row.orderId}
          focus="payments"
          onDrilldown={onDrilldown}
        />
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
          marginClass(cash),
        )}
      >
        {formatAmount(cash)}
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right tabular-nums',
          overRelease > 0 && 'text-destructive font-medium',
        )}
      >
        {formatAmount(overRelease)}
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.outCommittedAmount))}
      </td>
    </>
  );
}

export function UnitEconomicsOverviewTable({
  data,
  items,
  variant = 'overview',
  onDrilldown,
}: {
  data: UnitEconomicsBoardData;
  items: UnitEconomicsRow[];
  variant?: 'overview' | 'funding';
  onDrilldown?: DrilldownHandler;
}) {
  const { loading, error, reload } = data;

  const displayItems = useMemo(() => {
    if (variant !== 'funding') return items;
    return [...items].sort(
      (a, b) => Number.parseFloat(b.cashBalance) - Number.parseFloat(a.cashBalance),
    );
  }, [items, variant]);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  const isFunding = variant === 'funding';

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table
          className={cn(
            'w-full border-collapse text-xs',
            isFunding ? 'min-w-[44rem]' : 'min-w-[56rem]',
          )}
        >
          <thead className="bg-card sticky top-0 z-10">
            <tr className="text-muted-foreground text-left">
              <th className="border-border border-b px-3 py-2 font-semibold">Delivery unit</th>
              {isFunding ? (
                <>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Received
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Cash balance
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
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
                <th className="border-border border-b px-2 py-2 text-right font-semibold">
                  Received
                </th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">
                  To receive
                </th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">Spent</th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">
                  Bonus to pay
                </th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">
                  Committed
                </th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash</th>
                <th className="border-border border-b px-2 py-2 text-right font-semibold">
                  Margin
                </th>
              </tr>
            ) : null}
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isFunding ? 5 : 8}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  No delivery units with financial activity yet.
                </td>
              </tr>
            ) : (
              displayItems.map((row) => (
                <tr key={row.orderId} className="hover:bg-muted/30">
                  {isFunding ? (
                    <FundingRowCells row={row} onDrilldown={onDrilldown} />
                  ) : (
                    <OverviewRowCells row={row} onDrilldown={onDrilldown} />
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
