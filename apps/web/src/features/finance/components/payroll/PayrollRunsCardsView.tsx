'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { formatPayrollMonthLabel } from '@/features/finance/utils/salary-board-month-utils';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import { PayrollRunsPaidProgressBar } from '@/features/finance/components/payroll/payroll-runs-paid-progress';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PayrollRunsCardsView({ items }: { items: PayrollRunListRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((row) => {
        const payable = parseAmount(row.totalPayable);
        const paid = parseAmount(row.totalPaid);
        const remaining = payrollRunRemainingMajorUnits(row.totalPayable, row.totalPaid);

        return (
          <article
            key={row.id}
            className="border-border bg-card hover:border-primary/30 flex flex-col rounded-xl border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/finance/payroll/${row.id}`}
                className="text-foreground text-base font-semibold hover:underline"
              >
                {formatPayrollMonthLabel(row.payrollMonth)}
              </Link>
              <PayrollRunStatusBadge status={row.status} />
            </div>

            <p className="text-foreground mt-3 text-2xl font-semibold tabular-nums">
              {formatAmount(payable)}
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {formatAmount(paid)} paid · {formatAmount(remaining)} left
            </p>

            <PayrollRunsPaidProgressBar paid={paid} payable={payable} className="mt-3" />

            <dl className="text-muted-foreground mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="font-medium tracking-wide uppercase">Lines</dt>
                <dd className="text-foreground tabular-nums">{row._count.salaryLines}</dd>
              </div>
              <div>
                <dt className="font-medium tracking-wide uppercase">Expenses</dt>
                <dd className="text-foreground tabular-nums">
                  {row.materializedExpenseLineCount} / {row._count.salaryLines}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
