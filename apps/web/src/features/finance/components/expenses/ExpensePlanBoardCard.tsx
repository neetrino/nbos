'use client';

import { CalendarDays, FolderKanban } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';

export interface ExpensePlanBoardCardProps {
  plan: ExpensePlan;
  onOpen: (plan: ExpensePlan) => void;
}

/** Kanban card — whole surface opens detail sheet (invoice board parity). */
export function ExpensePlanBoardCard({ plan, onOpen }: ExpensePlanBoardCardProps) {
  return (
    <KanbanCardShell
      role="button"
      tabIndex={0}
      hoverSurface="muted30"
      className="cursor-pointer space-y-1.5"
      onClick={() => onOpen(plan)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(plan);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground line-clamp-2 text-sm leading-snug font-medium">{plan.name}</p>
        <StatusBadge
          label={expensePlanFrequencyLabel(plan.frequency)}
          variant="gray"
          className="shrink-0"
        />
      </div>
      <p className="text-foreground text-sm font-bold tabular-nums">
        {formatAmount(Number(plan.amount))}
      </p>
      <p className="text-muted-foreground text-xs">{plan.category}</p>
      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        <CalendarDays size={10} aria-hidden />
        Due {formatExpensePlanShortDate(plan.nextDueDate)}
      </div>
      {plan.project ? (
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <FolderKanban size={10} aria-hidden />
          {plan.project.code}
        </div>
      ) : null}
      <p className="text-muted-foreground text-xs">
        {plan._count.expenses} linked card{plan._count.expenses === 1 ? '' : 's'}
        {plan.autoGenerate ? ' · Auto-generate' : ''}
      </p>
    </KanbanCardShell>
  );
}
