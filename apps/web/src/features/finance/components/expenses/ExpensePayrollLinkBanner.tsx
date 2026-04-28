'use client';

import Link from 'next/link';
import { Banknote, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ExpensePayrollLinkBannerProps {
  payrollRunId: string;
}

export function ExpensePayrollLinkBanner({ payrollRunId }: ExpensePayrollLinkBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Banknote size={14} className="shrink-0 opacity-80" aria-hidden />
          Payroll materialization
        </span>
        <span className="text-muted-foreground">
          {' '}
          — this expense was created from an approved payroll run (see run for salary lines and
          audit).
        </span>
      </p>
      <Link
        href={`/finance/payroll/${payrollRunId}`}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'inline-flex items-center gap-1',
        )}
      >
        Open payroll run
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </div>
  );
}
