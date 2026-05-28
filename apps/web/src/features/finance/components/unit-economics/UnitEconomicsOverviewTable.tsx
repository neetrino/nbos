'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  unitEconomicsApi,
  type UnitEconomicsList,
  type UnitEconomicsRow,
} from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

function marginClass(margin: number): string {
  if (margin < 0) return 'text-destructive';
  if (margin > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function UnitEconomicsRowCells({ row }: { row: UnitEconomicsRow }) {
  const margin = Number.parseFloat(row.estimatedMargin);
  return (
    <>
      <td className="border-border border-b px-3 py-2">
        <Link
          href={`/finance/orders?search=${encodeURIComponent(row.orderCode)}`}
          className="hover:text-primary font-medium"
        >
          {row.label}
        </Link>
        <p className="text-muted-foreground text-[11px]">
          {row.orderCode} · {row.projectCode} · {row.orderType}
          {row.deliveryOpen ? ' · open' : ' · closed'}
        </p>
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.invoicedAmount))}
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.receivedAmount))}
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.receivableAmount))}
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

function FundingRowCells({ row }: { row: UnitEconomicsRow }) {
  const margin = Number.parseFloat(row.estimatedMargin);
  const overFunding = Number.parseFloat(row.overFundingAmount);
  return (
    <>
      <td className="border-border border-b px-3 py-2">
        <Link
          href={`/finance/orders?search=${encodeURIComponent(row.orderCode)}`}
          className="hover:text-primary font-medium"
        >
          {row.label}
        </Link>
        <p className="text-muted-foreground text-[11px]">
          {row.orderCode} · {row.projectCode}
        </p>
      </td>
      <td className="border-border border-b px-2 py-2 text-right tabular-nums">
        {formatAmount(Number.parseFloat(row.receivedAmount))}
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
}: {
  variant?: 'overview' | 'funding';
}) {
  const [items, setItems] = useState<UnitEconomicsRow[]>([]);
  const [totals, setTotals] = useState<UnitEconomicsList['totals'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await unitEconomicsApi.list();
      setItems(data.items);
      setTotals(data.totals);
    } catch (caught) {
      setItems([]);
      setTotals(null);
      setError(getApiErrorMessage(caught, 'Unit economics could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayItems = useMemo(() => {
    if (variant !== 'funding') return items;
    return [...items].sort(
      (a, b) => Number.parseFloat(b.availableCash) - Number.parseFloat(a.availableCash),
    );
  }, [items, variant]);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  const isFunding = variant === 'funding';

  return (
    <div className="flex flex-col gap-3">
      {totals ? (
        <div className="text-muted-foreground flex flex-wrap gap-4 text-xs tabular-nums">
          <span>Invoiced {formatAmount(Number.parseFloat(totals.invoicedAmount))}</span>
          <span>Received {formatAmount(Number.parseFloat(totals.receivedAmount))}</span>
          <span>Receivable {formatAmount(Number.parseFloat(totals.receivableAmount))}</span>
          <span>Expenses {formatAmount(Number.parseFloat(totals.expensesPaidAmount))}</span>
          <span>Planned bonuses {formatAmount(Number.parseFloat(totals.plannedBonuses))}</span>
          <span>Available cash {formatAmount(Number.parseFloat(totals.availableCash))}</span>
        </div>
      ) : null}
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
                  {isFunding ? <FundingRowCells row={row} /> : <UnitEconomicsRowCells row={row} />}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
