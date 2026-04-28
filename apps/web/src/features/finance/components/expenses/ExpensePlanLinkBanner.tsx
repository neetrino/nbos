'use client';

import Link from 'next/link';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ExpensePlanLinkBannerProps {
  planName: string;
}

export function ExpensePlanLinkBanner({ planName }: ExpensePlanLinkBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <CalendarDays size={14} className="shrink-0 opacity-80" aria-hidden />
          Expense plan
        </span>
        <span className="text-muted-foreground">
          {' '}
          — this card was generated from plan{' '}
          <span className="text-foreground font-medium">{planName}</span>.
        </span>
      </p>
      <Link
        href="/finance/expenses/plans"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'inline-flex items-center gap-1',
        )}
      >
        Open expense plans
        <ExternalLink size={12} className="opacity-70" aria-hidden />
      </Link>
    </div>
  );
}
