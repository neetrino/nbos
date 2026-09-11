'use client';

import Link from 'next/link';
import { Banknote, FolderKanban } from 'lucide-react';
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
import { expenseOwnerLabel } from '@/features/finance/utils/expense-owner-label';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from '@/features/finance/utils/parse-payroll-expense-notes';
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

const UNPLANNED_EXPENSE_TYPE = 'UNPLANNED';
const EXPENSE_MANUAL_LIST_LABEL = 'Manual';

interface ExpensesTableSectionProps {
  expenses: Expense[];
  onOpen: (expense: Expense) => void;
}

export function ExpensesTableSection({ expenses, onOpen }: ExpensesTableSectionProps) {
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Expense</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Due Date</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Category</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Paid</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Status</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Payroll</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <ExpenseTableRow key={expense.id} expense={expense} onOpen={onOpen} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpenseTableRow({
  expense,
  onOpen,
}: {
  expense: Expense;
  onOpen: (expense: Expense) => void;
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
  const hasLedger = expense.paidAmount !== undefined;
  const ownerLabel = expenseOwnerLabel(expense);

  return (
    <TableRow className={FINANCE_LIST_ROW_HOVER_CLASS} onClick={() => onOpen(expense)}>
      <TableCell className={`${FINANCE_LIST_CELL_CLASS} max-w-[16rem]`}>
        <ExpenseNameCell name={expense.name} type={expense.type} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListAmount amount={expense.amount} />
      </TableCell>
      <TableCell className={FINANCE_LIST_CELL_CLASS}>
        <FinanceListDate value={expense.dueDate} />
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
        {ledgerPresentation && hasLedger ? (
          <div className="flex flex-col gap-1">
            <FinanceListAmount amount={expense.paidAmount!} />
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
        {ownerLabel ? (
          <FinanceListIconLabel
            icon={FolderKanban}
            iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
            label={ownerLabel}
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
    </TableRow>
  );
}

function ExpenseNameCell({ name, type }: { name: string; type: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1">
        <FinanceListPrimaryCell title={name} />
      </span>
      {type === UNPLANNED_EXPENSE_TYPE ? (
        <StatusBadge
          label={EXPENSE_MANUAL_LIST_LABEL}
          variant="orange"
          className={FINANCE_LIST_BADGE_CLASS}
        />
      ) : null}
    </span>
  );
}
