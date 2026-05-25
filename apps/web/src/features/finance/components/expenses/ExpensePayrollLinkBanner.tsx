'use client';

import Link from 'next/link';
import { Banknote } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { salaryBoardMonthSheetHref } from '@/features/finance/constants/expense-payroll-deep-link';
import { cn } from '@/lib/utils';

export interface ExpensePayrollLinkBannerProps {
  payrollRunId: string;
  payrollMonth?: string | null;
  salaryLineId?: string | null;
}

/** Compact payroll link row for expense detail sheet (Pay Now ↔ payroll ↔ month sheet). */
export function ExpensePayrollLinkBanner({
  payrollRunId,
  payrollMonth,
  salaryLineId,
}: ExpensePayrollLinkBannerProps) {
  const label = payrollMonth?.trim() || 'Payroll run';
  const lineId = salaryLineId?.trim() || null;

  return (
    <div className="border-border/80 bg-muted/25 flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 text-xs">
      <Banknote size={12} className="text-muted-foreground shrink-0" aria-hidden />
      <span className="text-muted-foreground min-w-0 flex-1 truncate">Payroll · {label}</span>
      {lineId ? (
        <Link
          href={salaryBoardMonthSheetHref(lineId)}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-6 shrink-0 px-2 text-xs',
          )}
        >
          Month
        </Link>
      ) : null}
      <Link
        href={`/finance/payroll/${payrollRunId}`}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-6 shrink-0 px-2 text-xs',
        )}
      >
        Run
      </Link>
    </div>
  );
}
