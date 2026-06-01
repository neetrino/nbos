'use client';

import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount, parseMoneyAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { cn } from '@/lib/utils';

function marginClass(margin: string): string {
  const n = Number.parseFloat(margin);
  if (n < 0) return 'text-destructive';
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

const KIND_LABEL: Record<string, string> = {
  PRODUCT: 'Product',
  EXTENSION: 'Extension',
  ORDER: 'Unit',
};

export function UnitEconomicsProductTable({ data }: { data: UnitEconomicsBoardData }) {
  const { products, loading, error, reload } = data;

  if (loading && products.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Roll-up by product or extension within each project. Use By unit or Cards to open a single
        delivery unit.
      </p>
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table className="w-full min-w-[52rem] border-collapse text-xs">
          <thead className="bg-card sticky top-0 z-10">
            <tr className="text-muted-foreground text-left">
              <th className="border-border border-b px-3 py-2 font-semibold">Product / unit</th>
              <th className="border-border border-b px-2 py-2 font-semibold">Kind</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Units</th>
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
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Cash</th>
              <th className="border-border border-b px-2 py-2 text-right font-semibold">Margin</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-muted-foreground px-3 py-8 text-center">
                  No product roll-ups yet.
                </td>
              </tr>
            ) : (
              products.map((row) => (
                <tr key={row.rollupKey} className="hover:bg-muted/30">
                  <td className="border-border border-b px-3 py-2">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-muted-foreground text-[11px]">{row.projectCode}</p>
                  </td>
                  <td className="border-border border-b px-2 py-2">
                    {KIND_LABEL[row.kind] ?? row.kind}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {row.unitCount}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(parseMoneyAmount(row.receivedAmount))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(parseMoneyAmount(row.receivableAmount))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(parseMoneyAmount(row.expensesPaidAmount))}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(parseMoneyAmount(row.remainingBonuses))}
                  </td>
                  <td
                    className={cn(
                      'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
                      marginClass(row.cashBalance),
                    )}
                  >
                    {formatAmount(parseMoneyAmount(row.cashBalance))}
                  </td>
                  <td
                    className={cn(
                      'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
                      marginClass(row.marginAfterCommitments),
                    )}
                  >
                    {formatAmount(parseMoneyAmount(row.marginAfterCommitments))}
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
