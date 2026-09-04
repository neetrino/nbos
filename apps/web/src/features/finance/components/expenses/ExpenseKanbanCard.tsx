'use client';

import type { LucideIcon } from 'lucide-react';
import { AppWindow, Calendar, ChevronRight } from 'lucide-react';
import { KanbanCardShell } from '@/components/shared';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryVisual,
} from '@/features/finance/constants/expense-category-visual';
import { formatAmount } from '@/features/finance/constants/finance';
import { formatExpenseCardDueDate } from '@/features/finance/utils/expense-kanban-card-due';
import { resolveExpensePayrollRunId } from '@/features/finance/utils/parse-payroll-expense-notes';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Expense } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

interface ExpenseKanbanCardProps {
  expense: Expense;
  onOpen: (expense: Expense) => void;
}

export function ExpenseKanbanCard({ expense, onOpen }: ExpenseKanbanCardProps) {
  return (
    <KanbanCardShell
      as="article"
      radius="xl"
      padding="none"
      baseShadow="sm"
      hoverShadow="md"
      className="group relative overflow-hidden"
    >
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'block cursor-pointer space-y-3 p-3.5',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        )}
        onClick={() => onOpen(expense)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(expense);
          }
        }}
      >
        <ExpenseCardHeader expense={expense} />
        <ExpenseCardMetrics expense={expense} />
        {expense.project ? <ExpenseCardProjectBar projectName={expense.project.name} /> : null}
      </div>
    </KanbanCardShell>
  );
}

function ExpenseCardHeader({ expense }: { expense: Expense }) {
  const categoryVisual = getExpenseCategoryVisual(expense.category);
  const CategoryIcon = categoryVisual.icon;
  const categoryLabel = getExpenseCategoryLabel(expense.category);
  const payrollLinked = Boolean(resolveExpensePayrollRunId(expense));

  return (
    <header className="flex items-center gap-2.5">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          categoryVisual.iconShellClassName,
        )}
      >
        <CategoryIcon size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
          {categoryLabel}
          {payrollLinked ? ' · Payroll' : ''}
        </p>
        <p className="text-foreground truncate text-base leading-tight font-bold tracking-tight">
          {expense.name}
        </p>
      </div>
    </header>
  );
}

function ExpenseCardMetrics({ expense }: { expense: Expense }) {
  const paidAmount = parseMoneyAmount(expense.paidAmount ?? 0);

  return (
    <div className="border-border/60 space-y-3 border-t pt-3">
      <p className="text-foreground text-lg font-bold tracking-tight tabular-nums">
        {formatAmount(parseMoneyAmount(expense.amount))}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ExpenseMetric
          icon={AppWindow}
          iconShellClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
          label="Paid"
          value={formatAmount(paidAmount)}
        />
        <ExpenseMetric
          icon={Calendar}
          iconShellClassName="bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"
          label="Due"
          value={formatExpenseCardDueDate(expense.dueDate)}
          bordered
        />
      </div>
    </div>
  );
}

function ExpenseMetric({
  icon: Icon,
  iconShellClassName,
  label,
  value,
  bordered = false,
}: {
  icon: LucideIcon;
  iconShellClassName: string;
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div className={cn('min-w-0', bordered && 'border-border/60 border-l pl-2')}>
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            iconShellClassName,
          )}
        >
          <Icon size={12} aria-hidden />
        </div>
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
          {label}
        </p>
      </div>
      <p className="text-foreground mt-1 truncate text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ExpenseCardProjectBar({ projectName }: { projectName: string }) {
  return (
    <div className="bg-muted/60 text-foreground flex items-center gap-2 rounded-xl px-2.5 py-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
        <AppWindow size={14} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{projectName}</span>
      <ChevronRight size={14} className="shrink-0 text-violet-500" aria-hidden />
    </div>
  );
}
