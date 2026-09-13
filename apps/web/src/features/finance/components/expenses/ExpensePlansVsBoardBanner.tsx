'use client';

import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EXPENSE_LIST_PATH } from '@/features/finance/constants/project-expenses-drilldown';
import { cn } from '@/lib/utils';
import { useExpensePlansT } from './expense-plan-message-keys';

export type ExpensePlansVsBoardBannerVariant = 'plans' | 'board';

export function ExpensePlansVsBoardBanner({
  variant,
}: {
  variant: ExpensePlansVsBoardBannerVariant;
}) {
  const t = useExpensePlansT();
  const href = variant === 'plans' ? EXPENSE_LIST_PATH : '/finance/expenses/plans';
  const body = variant === 'plans' ? t('banner.plansBody') : t('banner.boardBody');
  const linkLabel = variant === 'plans' ? t('banner.plansLink') : t('banner.boardLink');

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
