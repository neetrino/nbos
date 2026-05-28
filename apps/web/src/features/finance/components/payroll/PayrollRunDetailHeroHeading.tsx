'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import { formatPayrollMonthLabel } from '@/features/finance/utils/salary-board-month-utils';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

export function PayrollRunDetailHeroHeading({
  payrollMonth,
  status,
  backHref,
  lineCount,
  expenseCount,
  bonusReleaseCount,
}: {
  payrollMonth: string;
  status: PayrollRunStatus;
  backHref: string;
  lineCount: number;
  expenseCount: number;
  bonusReleaseCount: number;
}) {
  const monthLabel = formatPayrollMonthLabel(payrollMonth);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} aria-hidden />
        Back
      </Link>
      <h2 className="text-foreground text-base font-semibold tracking-tight">{monthLabel}</h2>
      <PayrollRunStatusBadge status={status} />
      <p className="text-muted-foreground w-full text-xs sm:ml-auto sm:w-auto">
        {lineCount} lines · {expenseCount} expenses · {bonusReleaseCount} bonus releases
      </p>
    </div>
  );
}
