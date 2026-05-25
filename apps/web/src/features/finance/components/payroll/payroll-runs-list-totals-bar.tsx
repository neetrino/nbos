'use client';

import { formatAmount } from '@/features/finance/constants/finance';

export function PayrollRunsListTotalsBar({
  runCount,
  payable,
  paid,
  remaining,
  lines,
}: {
  runCount: number;
  payable: number;
  paid: number;
  remaining: number;
  lines: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <TotalTile label="Runs" value={String(runCount)} />
      <TotalTile label="Salary lines" value={String(lines)} />
      <TotalTile label="Payable" value={formatAmount(payable)} />
      <TotalTile label="Paid" value={formatAmount(paid)} />
      <TotalTile label="Remaining" value={formatAmount(remaining)} accent />
    </div>
  );
}

function TotalTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p
        className={
          accent
            ? 'text-foreground mt-1 text-lg font-semibold tabular-nums'
            : 'text-foreground mt-1 text-lg font-semibold tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}
