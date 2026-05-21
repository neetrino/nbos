'use client';

import Link from 'next/link';
import { FileOutput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/features/finance/constants/finance';
import { planExpensesDrilldownHref } from '@/features/finance/constants/project-expenses-drilldown';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export interface ExpensePlanBoardCardProps {
  plan: ExpensePlan;
  onGenerate: (plan: ExpensePlan) => void;
}

export function ExpensePlanBoardCard({ plan, onGenerate }: ExpensePlanBoardCardProps) {
  return (
    <div className="border-border bg-card relative rounded-xl border p-3">
      <Link
        href={`/finance/expenses/plans/${plan.id}`}
        className="focus-visible:ring-ring block space-y-1.5 rounded-lg pr-8 focus-visible:ring-2 focus-visible:outline-none"
      >
        <p className="text-sm leading-snug font-medium">{plan.name}</p>
        <p className="text-muted-foreground text-xs">{formatAmount(Number(plan.amount))}</p>
        <p className="text-muted-foreground text-xs">
          Next due {formatExpensePlanShortDate(plan.nextDueDate)}
        </p>
        <p className="text-muted-foreground text-xs">
          {plan._count.expenses} card{plan._count.expenses === 1 ? '' : 's'}
          {plan.autoGenerate ? ' · Auto' : ''}
        </p>
      </Link>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onGenerate(plan)}
        >
          <FileOutput size={12} className="mr-1" aria-hidden />
          Generate card
        </Button>
        {plan._count.expenses > 0 ? (
          <Link
            href={planExpensesDrilldownHref(plan.id)}
            className="text-primary inline-flex h-7 items-center text-xs hover:underline"
          >
            On board
          </Link>
        ) : null}
      </div>
      <span className="text-muted-foreground absolute top-3 right-3 text-[10px] font-medium tracking-wide uppercase">
        {expensePlanFrequencyLabel(plan.frequency)}
      </span>
    </div>
  );
}
