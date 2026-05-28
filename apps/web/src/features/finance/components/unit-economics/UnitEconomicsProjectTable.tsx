'use client';

import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsBoardData } from '@/features/finance/components/unit-economics/unit-economics-board-data';
import { UnitEconomicsTotalsBar } from '@/features/finance/components/unit-economics/unit-economics-totals-bar';
import { cn } from '@/lib/utils';

function marginClass(margin: string): string {
  const n = Number.parseFloat(margin);
  if (n < 0) return 'text-destructive';
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

export function UnitEconomicsProjectTable({ data }: { data: UnitEconomicsBoardData }) {
  const { projects, totals, loading, error, reload } = data;

  if (loading && projects.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void reload()} />;

  return (
    <div className="flex flex-col gap-3">
      {totals ? <UnitEconomicsTotalsBar totals={totals} /> : null}
      <p className="text-muted-foreground text-sm">
        Roll-up across delivery units in each project. Switch to By unit or Cards to open a single
        delivery unit.
      </p>
      <div className="border-border bg-card overflow-auto rounded-xl border">
        <table className="w-full min-w-[52rem] border-collapse text-xs">
          <thead className="bg-card sticky top-0 z-10">
            <tr className="text-muted-foreground text-left">
              <th className="border-border border-b px-3 py-2 font-semibold">Project</th>
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
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-3 py-8 text-center">
                  No projects with unit economics activity yet.
                </td>
              </tr>
            ) : (
              projects.map((row) => (
                <tr key={row.projectId} className="hover:bg-muted/30">
                  <td className="border-border border-b px-3 py-2">
                    <p className="font-medium">{row.projectName}</p>
                    <p className="text-muted-foreground text-[11px]">{row.projectCode}</p>
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {row.unitCount}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(row.receivedAmount)}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(row.receivableAmount)}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(row.expensesPaidAmount)}
                  </td>
                  <td className="border-border border-b px-2 py-2 text-right tabular-nums">
                    {formatAmount(row.remainingBonuses)}
                  </td>
                  <td
                    className={cn(
                      'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
                      marginClass(row.cashBalance),
                    )}
                  >
                    {formatAmount(row.cashBalance)}
                  </td>
                  <td
                    className={cn(
                      'border-border border-b px-2 py-2 text-right font-medium tabular-nums',
                      marginClass(row.marginAfterCommitments),
                    )}
                  >
                    {formatAmount(row.marginAfterCommitments)}
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
