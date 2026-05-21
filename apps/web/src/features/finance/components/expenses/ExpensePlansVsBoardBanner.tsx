'use client';

import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EXPENSE_LIST_PATH } from '@/features/finance/constants/project-expenses-drilldown';
import { cn } from '@/lib/utils';

export type ExpensePlansVsBoardBannerVariant = 'plans' | 'board';

const COPY: Record<
  ExpensePlansVsBoardBannerVariant,
  { body: string; href: string; linkLabel: string }
> = {
  plans: {
    body: 'Plans define recurring or expected spend. Generated expense cards appear on the live board when due.',
    href: EXPENSE_LIST_PATH,
    linkLabel: 'Open expense board',
  },
  board: {
    body: 'This board shows expense cards to pay now. Create or edit recurring rules under Expense plans.',
    href: '/finance/expenses/plans',
    linkLabel: 'Open expense plans',
  },
};

export function ExpensePlansVsBoardBanner({
  variant,
}: {
  variant: ExpensePlansVsBoardBannerVariant;
}) {
  const { body, href, linkLabel } = COPY[variant];

  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">{body}</p>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'inline-flex items-center gap-1',
        )}
      >
        <ArrowRightLeft size={14} className="opacity-70" aria-hidden />
        {linkLabel}
      </Link>
    </div>
  );
}
