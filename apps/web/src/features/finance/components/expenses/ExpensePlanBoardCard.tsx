'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Calendar, FolderKanban } from 'lucide-react';
import { KanbanCardShell, StatusBadge } from '@/components/shared';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryVisual,
} from '@/features/finance/constants/expense-category-visual';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import { parseMoneyAmount } from '@/lib/format/money';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { cn } from '@/lib/utils';

export interface ExpensePlanBoardCardProps {
  plan: ExpensePlan;
  onOpen: (plan: ExpensePlan) => void;
}

/** Kanban card — invoice/orders shell; original plan fields preserved. */
export function ExpensePlanBoardCard({ plan, onOpen }: ExpensePlanBoardCardProps) {
  const frequencyLabel = expensePlanFrequencyLabel(plan.frequency);
  const categoryVisual = getExpenseCategoryVisual(plan.category);
  const CategoryIcon = categoryVisual.icon;
  const categoryLabel = getExpenseCategoryLabel(plan.category);
  const linkedCount = plan._count.expenses;
  const linkedCardsLabel = `${linkedCount} linked card${linkedCount === 1 ? '' : 's'}`;

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'cursor-pointer space-y-3 rounded-xl p-4',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onOpen(plan)}
        onKeyDown={(event) => handleCardKeyDown(event, plan, onOpen)}
      >
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground min-w-0 truncate text-sm leading-snug font-bold">
              {plan.name}
            </p>
            <StatusBadge
              label={frequencyLabel}
              variant="blue"
              className="shrink-0 rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-foreground text-xl leading-none font-bold tabular-nums">
            {formatAmount(parseMoneyAmount(plan.amount))}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge
              label={linkedCardsLabel}
              variant="green"
              className="rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
            />
            {plan.autoGenerate ? (
              <StatusBadge
                label="Auto-generate"
                variant="blue"
                className="rounded-full px-2.5 text-[10px] font-semibold tracking-wide"
              />
            ) : null}
          </div>
        </div>

        <div className="border-border flex flex-col gap-2.5 border-t pt-3">
          <MetaRow
            icon={<CategoryIcon size={14} aria-hidden />}
            iconClassName={categoryVisual.iconShellClassName}
            label={categoryLabel}
          />
          <MetaRow
            icon={<Calendar size={14} aria-hidden />}
            iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
            labelClassName="font-bold text-orange-500 dark:text-orange-400"
            label={`Due ${formatExpensePlanShortDate(plan.nextDueDate)}`}
          />
          {plan.project ? (
            <MetaRow
              icon={<FolderKanban size={14} aria-hidden />}
              iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
              label={plan.project.code}
            />
          ) : null}
        </div>
      </div>
    </KanbanCardShell>
  );
}

function MetaRow({
  icon,
  iconClassName,
  label,
  labelClassName,
}: {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  labelClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5">
      <span
        className={cn(
          'flex size-7 items-center justify-center justify-self-start rounded-lg',
          iconClassName,
        )}
      >
        {icon}
      </span>
      <p className={cn('text-foreground/80 truncate text-xs', labelClassName)}>{label}</p>
    </div>
  );
}

function handleCardKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  plan: ExpensePlan,
  onOpen: (plan: ExpensePlan) => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onOpen(plan);
}
