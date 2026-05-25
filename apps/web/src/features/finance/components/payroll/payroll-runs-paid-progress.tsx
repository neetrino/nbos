'use client';

import { cn } from '@/lib/utils';

const PAYROLL_PAID_PROGRESS_MIN_PCT = 0;
const PAYROLL_PAID_PROGRESS_MAX_PCT = 100;

export function payrollPaidProgressPercent(paid: number, payable: number): number {
  if (payable <= 0) return PAYROLL_PAID_PROGRESS_MIN_PCT;
  const pct = Math.round((paid / payable) * PAYROLL_PAID_PROGRESS_MAX_PCT);
  return Math.min(PAYROLL_PAID_PROGRESS_MAX_PCT, Math.max(PAYROLL_PAID_PROGRESS_MIN_PCT, pct));
}

export function PayrollRunsPaidProgressBar({
  paid,
  payable,
  className,
}: {
  paid: number;
  payable: number;
  className?: string;
}) {
  const pct = payrollPaidProgressPercent(paid, payable);

  return (
    <div
      className={cn('bg-muted h-1.5 w-full overflow-hidden rounded-full', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={PAYROLL_PAID_PROGRESS_MIN_PCT}
      aria-valuemax={PAYROLL_PAID_PROGRESS_MAX_PCT}
      aria-label={`${pct}% paid`}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
