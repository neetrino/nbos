'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PayrollRunStatusHeroBadge } from '@/features/finance/components/payroll/PayrollRunStatusHeroBadge';
import type { PayrollRunDetail } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

export function PayrollRunDetailHeroBar({
  run,
  backHref,
  className,
}: {
  run: PayrollRunDetail;
  backHref: string;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-3', className)}>
      <Link
        href={backHref}
        className={cn(
          'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60',
          'inline-flex size-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors',
        )}
        aria-label="Back to payroll list"
      >
        <ArrowLeft className="size-4" aria-hidden />
      </Link>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          Payroll
          <span className="text-muted-foreground font-medium"> · {run.payrollMonth}</span>
        </h2>
        <PayrollRunStatusHeroBadge status={run.status} />
      </div>
    </div>
  );
}
