'use client';

import Link from 'next/link';
import { FolderKanban, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  type ExpenseListNavigationSort,
  expenseDetailHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { Expense } from '@/lib/api/finance';

interface ExpenseKanbanCardProps {
  expense: Expense;
  listProjectId: string | null;
  listSort?: ExpenseListNavigationSort;
  onRequestDelete: (expense: Expense) => void;
}

export function ExpenseKanbanCard({
  expense,
  listProjectId,
  listSort,
  onRequestDelete,
}: ExpenseKanbanCardProps) {
  return (
    <div className="border-border bg-card relative rounded-xl border">
      <Link
        href={expenseDetailHref(expense.id, listProjectId, listSort)}
        className="focus-visible:ring-ring block cursor-pointer space-y-2 rounded-xl p-3 pr-11 transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">{expense.category}</span>
          <StatusBadge
            label={expense.type}
            variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
          />
        </div>
        <p className="text-sm font-medium">{expense.name}</p>
        <p className="text-sm font-bold">{formatAmount(parseFloat(expense.amount))}</p>
        {expense.project ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <FolderKanban size={10} />
            {expense.project.name}
          </div>
        ) : null}
      </Link>
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Expense actions"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.onClick?.(e);
                }}
              >
                <MoreHorizontal size={14} />
              </Button>
            )}
          />
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRequestDelete(expense)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
