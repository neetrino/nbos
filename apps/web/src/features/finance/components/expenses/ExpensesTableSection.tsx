'use client';

import Link from 'next/link';
import { Banknote, FolderKanban, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import { getExpenseStage } from '@/features/finance/constants/finance';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryVisual,
} from '@/features/finance/constants/expense-category-visual';
import type { Expense } from '@/lib/api/finance';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from '@/features/finance/utils/parse-payroll-expense-notes';
import { formatGroupedNumber, parseMoneyAmount } from '@/lib/format/money';
import {
  FINANCE_LIST_BADGE_CLASS,
  FINANCE_LIST_CELL_CLASS,
  FINANCE_LIST_HEAD_CLASS,
  FINANCE_LIST_ROW_HOVER_CLASS,
  FINANCE_LIST_SHELL_CLASS,
  FinanceListAmount,
  FinanceListDate,
  FinanceListIconLabel,
  FinanceListIconTile,
  FinanceListMutedDash,
  FinanceListPrimaryCell,
} from '@/features/finance/components/shared/finance-list-table';

interface ExpensesTableSectionProps {
  expenses: Expense[];
  onOpen: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
}

export function ExpensesTableSection({
  expenses,
  onOpen,
  onRequestDelete,
}: ExpensesTableSectionProps) {
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Expense</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Category</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Type</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Paid / Remaining</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Payroll</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Due Date</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} w-[52px] text-right`}>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <ExpenseTableRow
              key={expense.id}
              expense={expense}
              onOpen={onOpen}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpenseTableRow({
  expense,
  onOpen,
  onRequestDelete,
}: {
  expense: Expense;
  onOpen: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
}) {
  const stage = getExpenseStage(expense.status);
  const categoryVisual = getExpenseCategoryVisual(expense.category);
  const categoryLabel = getExpenseCategoryLabel(expense.category);
  const payrollRunId = resolveExpensePayrollRunId(expense);
  const payrollMonth = resolveExpensePayrollMonthLabel(expense);
  const ledgerPresentation =
    expense.paymentStatus !== undefined
      ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
      : null;
  const hasLedger = expense.paidAmount !== undefined && expense.remainingAmount !== undefined;
  const typeLabel = expense.type.replace(/_/g, ' ').toUpperCase();

  return (
    <TableRow className={FINANCE_LIST_ROW_HOVER_CLASS} onClick={() => onOpen(expense)}>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[16rem]`}>
        <FinanceListPrimaryCell title={expense.name} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <span className="flex min-w-0 items-center gap-2">
          <FinanceListIconTile
            icon={categoryVisual.icon}
            className={categoryVisual.iconShellClassName}
          />
          <span className="truncate text-sm">{categoryLabel}</span>
        </span>
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <StatusBadge
          label={typeLabel}
          variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
          className={FINANCE_LIST_BADGE_CLASS}
        />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListAmount amount={expense.amount} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {ledgerPresentation && hasLedger ? (
          <div className="flex flex-col gap-1">
            <FinanceListAmount amount={expense.paidAmount!} />
            <span className="text-muted-foreground text-xs tabular-nums">
              Left {formatGroupedNumber(parseMoneyAmount(expense.remainingAmount!))}
            </span>
            <StatusBadge
              label={ledgerPresentation.label}
              variant={ledgerPresentation.variant}
              className={FINANCE_LIST_BADGE_CLASS}
            />
          </div>
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {stage ? (
          <StatusBadge
            label={stage.label}
            variant={stage.variant}
            className={FINANCE_LIST_BADGE_CLASS}
          />
        ) : null}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {expense.project?.name ? (
          <FinanceListIconLabel
            icon={FolderKanban}
            iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
            label={expense.project.name}
          />
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        {payrollRunId ? (
          <Link
            href={`/finance/payroll/${payrollRunId}`}
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            <FinanceListIconTile
              icon={Banknote}
              className="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            />
            <span>{payrollMonth ?? 'Run'}</span>
          </Link>
        ) : (
          <FinanceListMutedDash />
        )}
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListDate value={expense.dueDate} />
      </TableCell>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} text-right`}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <Button
                {...props}
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground"
                aria-label={`Actions for ${expense.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onClick?.(e);
                }}
              >
                <MoreHorizontal size={14} />
              </Button>
            )}
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onRequestDelete(expense)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
