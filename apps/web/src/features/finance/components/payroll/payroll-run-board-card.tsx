'use client';

import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollRunsPaidProgressBar } from '@/features/finance/components/payroll/payroll-runs-paid-progress';
import { formatPayrollMonthLabel } from '@/features/finance/utils/salary-board-month-utils';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function payrollRunDetailHref(runId: string): string {
  return `/finance/payroll/${runId}`;
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  href: string,
  navigate: (path: string) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  navigate(href);
}

export function PayrollRunBoardCard({ run }: { run: PayrollRunListRow }) {
  const router = useRouter();
  const payable = parseAmount(run.totalPayable);
  const paid = parseAmount(run.totalPaid);
  const remaining = Math.max(0, payable - paid);
  const href = payrollRunDetailHref(run.id);
  const monthLabel = formatPayrollMonthLabel(run.payrollMonth);

  return (
    <div
      role="link"
      tabIndex={0}
      className={cn(
        'border-border bg-card hover:bg-muted/30 cursor-pointer rounded-lg border p-3 shadow-sm transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
      onClick={() => router.push(href)}
      onKeyDown={(event) => handleCardKeyDown(event, href, router.push)}
      aria-label={`Open payroll run ${monthLabel}`}
    >
      <p className="text-base font-semibold tabular-nums">{monthLabel}</p>
      <div className="mt-2">
        <PayrollRunsPaidProgressBar paid={paid} payable={payable} />
      </div>
      <dl className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
        <dt>Payable</dt>
        <dd className="text-foreground text-right font-medium tabular-nums">
          {formatAmount(payable)}
        </dd>
        <dt>Remaining</dt>
        <dd className="text-right font-medium tabular-nums">{formatAmount(remaining)}</dd>
        <dt>Lines</dt>
        <dd className="text-right tabular-nums">{run._count.salaryLines}</dd>
        <dt>Cards</dt>
        <dd className="text-right tabular-nums">{run.materializedExpenseLineCount}</dd>
      </dl>
    </div>
  );
}
