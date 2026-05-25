'use client';

import { Banknote, FolderKanban, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import { formatAmount } from '@/features/finance/constants/finance';
import { parseMoneyAmount } from '@/lib/format/money';
import type { Expense } from '@/lib/api/finance';
import { resolveExpensePayrollRunId } from '@/features/finance/utils/parse-payroll-expense-notes';

interface ExpenseKanbanCardProps {
  expense: Expense;
  onOpen: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
}

export function ExpenseKanbanCard({ expense, onOpen, onRequestDelete }: ExpenseKanbanCardProps) {
  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;
  const hasLedger = expense.paidAmount !== undefined && expense.remainingAmount !== undefined;
  const payrollLinked = Boolean(resolveExpensePayrollRunId(expense));

  return (
    <div className="border-border bg-card relative rounded-xl border">
      <div
        role="button"
        tabIndex={0}
        className="focus-visible:ring-ring block cursor-pointer space-y-2 rounded-xl p-3 pr-11 transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => onOpen(expense)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(expense);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium"
            title={payrollLinked ? 'Linked to a payroll run' : undefined}
          >
            {payrollLinked ? (
              <Banknote size={10} className="text-accent shrink-0" aria-hidden />
            ) : null}
            {expense.category}
          </span>
          <StatusBadge
            label={expense.type}
            variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
          />
        </div>
        <p className="text-sm font-medium">{expense.name}</p>
        <p className="text-sm font-bold">{formatAmount(parseMoneyAmount(expense.amount))}</p>
        {ledgerPresentation && hasLedger ? (
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground text-xs tabular-nums">
              Paid {formatAmount(parseMoneyAmount(expense.paidAmount))} · Left{' '}
              {formatAmount(parseMoneyAmount(expense.remainingAmount))}
            </p>
            <StatusBadge label={ledgerPresentation.label} variant={ledgerPresentation.variant} />
          </div>
        ) : null}
        {expense.project ? (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <FolderKanban size={10} />
            {expense.project.name}
          </div>
        ) : null}
      </div>
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
