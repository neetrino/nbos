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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'default' | 'paid' | 'remaining';
}) {
  return (
    <div
      className={cn(
        'border-border bg-card flex flex-col gap-0.5 rounded-lg border px-3 py-2',
        accent === 'paid' && 'border-emerald-500/20 bg-emerald-500/5',
        accent === 'remaining' && 'border-amber-500/20 bg-amber-500/5',
      )}
    >
      <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Compact Payable / Paid / Remaining — page body only, not PageHero. */
export function PayrollAllocationMatrixStatsStrip({ totals }: { totals: MatrixTotals }) {
  const payable = parseMoney(totals.totalPayable);
  const paid = parseMoney(totals.totalPaid);
  const remaining = parseMoney(totals.totalRemaining);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Payable" value={formatAmount(payable)} />
        <StatCard label="Paid" value={formatAmount(paid)} accent="paid" />
        <StatCard label="Remaining" value={formatAmount(remaining)} accent="remaining" />
      </div>
      <PayrollRunsPaidProgressBar paid={paid} payable={payable} className="h-1.5" />
    </div>
  );
}
