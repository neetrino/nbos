'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunStats } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PayrollRunsScopeStatsCard(props: {
  stats: PayrollRunStats | null;
  loading: boolean;
}) {
  const { stats, loading } = props;

  return (
    <Card size="sm" className="shadow-none">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-base">Scope totals</CardTitle>
        <CardDescription>
          All runs matching status and month filters (not limited to the visible page).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {loading || !stats ? (
          <p className="text-muted-foreground text-sm">Loading aggregates…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Runs in scope
                </p>
                <p className="text-lg font-semibold tabular-nums">{stats.runCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total payable
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatAmount(parseAmount(stats.totals.totalPayable))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total paid
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatAmount(parseAmount(stats.totals.totalPaid))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Total remaining
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatAmount(parseAmount(stats.totals.totalRemaining))}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                  Sum of run payables minus sum of run paid for this filter.
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Base salary (sum)
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatAmount(parseAmount(stats.totals.totalBaseSalary))}
                </p>
              </div>
            </div>
            {stats.byStatus.length > 0 ? (
              <div className="border-border flex flex-wrap gap-2 border-t pt-3">
                <span className="text-muted-foreground text-xs font-medium">By status:</span>
                {stats.byStatus.map((row) => (
                  <span
                    key={row.status}
                    className="bg-muted/60 text-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
                  >
                    <span>{PAYROLL_RUN_STATUS_LABEL[row.status]}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.runCount} · {formatAmount(parseAmount(row.totalPayable))}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
