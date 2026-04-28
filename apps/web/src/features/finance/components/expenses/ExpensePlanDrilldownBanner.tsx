'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpensePlanDrilldownBannerProps {
  expensePlanId: string;
  planBannerLabel: string | null;
  onClearPlanFilter: () => void;
}

export function ExpensePlanDrilldownBanner({
  expensePlanId,
  planBannerLabel,
  onClearPlanFilter,
}: ExpensePlanDrilldownBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        Showing expense cards linked to this plan (server filter)
        {planBannerLabel ? (
          <span className="text-muted-foreground"> — {planBannerLabel}</span>
        ) : null}
        .
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/finance/expenses/plans/${expensePlanId}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'inline-flex items-center gap-1',
          )}
        >
          <ClipboardList size={14} className="opacity-70" aria-hidden />
          Plan
        </Link>
        <Button variant="outline" size="sm" type="button" onClick={onClearPlanFilter}>
          Clear filter
        </Button>
      </div>
    </div>
  );
}
