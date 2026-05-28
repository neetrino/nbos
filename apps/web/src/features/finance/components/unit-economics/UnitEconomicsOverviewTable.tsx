'use client';

import { useMemo } from 'react';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { useUnitEconomicsList } from '@/features/finance/hooks/use-unit-economics-list';
import { UnitEconomicsTotalsBar } from '@/features/finance/components/unit-economics/unit-economics-totals-bar';
import type { UnitEconomicsDrilldownFocus, UnitEconomicsRow } from '@/lib/api/unit-economics';
import { UnitEconomicsDrilldownAmount } from '@/features/finance/components/unit-economics/unit-economics-drilldown-amount';
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
  const margin = Number.parseFloat(row.estimatedMargin);
  return (
    <>
      <UnitEconomicsUnitLinkCell row={row} onDrilldown={onDrilldown} />
      <td className="border-border border-b px-2 py-2 text-right">
        <UnitEconomicsDrilldownAmount
          amount={Number.parseFloat(row.invoicedAmount)}
          orderId={row.orderId}
          focus="invoices"
          onDrilldown={onDrilldown}
        />
      </td>
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
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.availableCash))}
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
  const margin = Number.parseFloat(row.estimatedMargin);
  const overFunding = Number.parseFloat(row.overFundingAmount);
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
      <td className="border-border border-b px-2 py-2 text-right font-medium tabular-nums">
        {formatAmount(Number.parseFloat(row.availableCash))}
      </td>
      <td
        className={cn(
          'border-border border-b px-2 py-2 text-right tabular-nums',
          overFunding > 0 && 'text-destructive font-medium',
        )}
      >
        {formatAmount(overFunding)}
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

export function UnitEconomicsOverviewTable({
  variant = 'overview',
  onDrilldown,
}: {
  variant?: 'overview' | 'funding';
  onDrilldown?: DrilldownHandler;
}) {
  const { items, totals, loading, error, reload } = useUnitEconomicsList();

  const displayItems = useMemo(() => {
    if (variant !== 'funding') return items;
    return [...items].sort(
      (a, b) => Number.parseFloat(b.availableCash) - Number.parseFloat(a.availableCash),
    );
  }, [items, variant]);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  const isFunding = variant === 'funding';

  return (
    <div className="flex flex-col gap-3">
      {totals ? <UnitEconomicsTotalsBar totals={totals} /> : null}
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table
          className={cn(
            'w-full border-collapse text-xs',
            isFunding ? 'min-w-[40rem]' : 'min-w-[68rem]',
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
                    Avail. cash
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Over funding
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Margin
                  </th>
                </>
              ) : (
                <>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Invoiced
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Received
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Receivable
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Expenses
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Planned
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Released
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Remaining
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Avail. cash
                  </th>
                  <th className="border-border border-b px-2 py-2 text-right font-semibold">
                    Margin
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td
                  colSpan={isFunding ? 5 : 10}
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
