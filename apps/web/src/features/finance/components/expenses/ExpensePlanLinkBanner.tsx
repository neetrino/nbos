'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import { cn } from '@/lib/utils';

export interface ExpensePlanLinkBannerProps {
  planId: string;
  planName: string;
}

/** Compact plan link row for expense detail sheet (no prose block). */
export function ExpensePlanLinkBanner({ planId, planName }: ExpensePlanLinkBannerProps) {
  return (
    <div className="border-border/80 bg-muted/25 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs">
      <CalendarDays size={12} className="text-muted-foreground shrink-0" aria-hidden />
      <Link
        href={expensePlansListWithOpenPlanHref(planId)}
        className="text-primary min-w-0 flex-1 truncate font-medium hover:underline"
        title={planName}
      >
        {planName}
      </Link>
      <Link
        href="/finance/expenses/plans"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-6 shrink-0 px-2 text-xs',
        )}
      >
        Plans
      </Link>
    </div>
  );
}
