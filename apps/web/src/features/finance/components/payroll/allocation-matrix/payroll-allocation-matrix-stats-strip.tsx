'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollRunsPaidProgressBar } from '@/features/finance/components/payroll/payroll-runs-paid-progress';
import type { PayrollAllocationMatrix } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

type MatrixTotals = PayrollAllocationMatrix['totals'];

function SummaryCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'paid' | 'remaining';
}) {
  return (
    <div
      className={cn(
        'bg-background flex min-w-0 flex-col justify-center gap-0.5 px-3 py-2',
        accent === 'paid' && 'bg-emerald-500/[0.04]',
        accent === 'remaining' && 'bg-amber-500/[0.04]',
      )}
    >
      <span className="text-muted-foreground truncate text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn(
          'text-foreground truncate text-sm font-semibold tabular-nums',
          accent === 'paid' && 'text-emerald-700 dark:text-emerald-400',
          accent === 'remaining' && 'text-amber-800 dark:text-amber-400',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Run counts + Payable / Paid / Remaining — equal cells across full width. */
export function PayrollAllocationMatrixStatsStrip({
  lineCount,
  expenseCount,
  bonusReleaseCount,
  totals,
}: {
  lineCount: number;
  expenseCount: number;
  bonusReleaseCount: number;
  totals: MatrixTotals;
}) {
  const payable = parseMoney(totals.totalPayable);
  const paid = parseMoney(totals.totalPaid);
  const remaining = parseMoney(totals.totalRemaining);

  return (
    <div className="border-border bg-border overflow-hidden rounded-lg border">
      <div className="grid w-full grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCell label="Lines" value={String(lineCount)} />
        <SummaryCell label="Expenses" value={String(expenseCount)} />
        <SummaryCell label="Bonus releases" value={String(bonusReleaseCount)} />
        <SummaryCell label="Payable" value={formatAmount(payable)} />
        <SummaryCell label="Paid" value={formatAmount(paid)} accent="paid" />
        <SummaryCell label="Remaining" value={formatAmount(remaining)} accent="remaining" />
      </div>
      <div className="bg-background px-3 py-1.5">
        <PayrollRunsPaidProgressBar paid={paid} payable={payable} className="h-1" />
      </div>
    </div>
  );
}
