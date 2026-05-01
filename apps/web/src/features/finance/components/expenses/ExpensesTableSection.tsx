'use client';

import Link from 'next/link';
import { Banknote, DollarSign, MoreHorizontal } from 'lucide-react';
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
import { getExpenseStage, formatAmount } from '@/features/finance/constants/finance';
import {
  type ExpenseListNavigationSort,
  expenseDetailHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import type { Expense } from '@/lib/api/finance';
import {
  resolveExpensePayrollMonthLabel,
  resolveExpensePayrollRunId,
} from '@/features/finance/utils/parse-payroll-expense-notes';

interface ExpensesTableSectionProps {
  expenses: Expense[];
  /** When set, row links include `?projectId=` for back-navigation parity. */
  listProjectId?: string | null;
  /** When set, row links include `?expensePlanId=` for back-navigation parity. */
  listExpensePlanId?: string | null;
  /** When set, detail links include the current list sort for back navigation. */
  listSort?: ExpenseListNavigationSort;
  fromBacklog?: boolean;
  onRequestDelete: (expense: Expense) => void;
}

export function ExpensesTableSection({
  expenses,
  listProjectId,
  listExpensePlanId = null,
  listSort,
  fromBacklog = false,
  onRequestDelete,
}: ExpensesTableSectionProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Expense</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Paid / Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Payroll</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[52px] text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const stage = getExpenseStage(expense.status);
            const payrollRunId = resolveExpensePayrollRunId(expense);
            const payrollMonth = resolveExpensePayrollMonthLabel(expense);
            const ledgerPresentation =
              expense.paymentStatus !== undefined
                ? expenseLedgerPaymentStatusPresentation(expense.paymentStatus)
                : null;
            const hasLedger =
              expense.paidAmount !== undefined && expense.remainingAmount !== undefined;
            return (
              <TableRow key={expense.id}>
                <TableCell>
                  <Link
                    href={expenseDetailHref(expense.id, listProjectId, listSort, {
                      fromBacklog,
                      expensePlanId: listExpensePlanId?.trim() || undefined,
                    })}
                    className="text-primary font-medium hover:underline"
                  >
                    {expense.name}
                  </Link>
                  {expense.notes && (
                    <p className="text-muted-foreground max-w-[200px] truncate text-xs">
                      {expense.notes}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-xs">{expense.category}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={expense.type}
                    variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1 font-semibold">
                    <DollarSign size={12} className="text-accent" />
                    {formatAmount(parseFloat(expense.amount))}
                  </span>
                </TableCell>
                <TableCell className="text-right align-top">
                  {ledgerPresentation && hasLedger ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium tabular-nums">
                        {formatAmount(parseFloat(expense.paidAmount!))} /{' '}
                        {formatAmount(parseFloat(expense.remainingAmount!))}
                      </span>
                      <StatusBadge
                        label={ledgerPresentation.label}
                        variant={ledgerPresentation.variant}
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {stage && <StatusBadge label={stage.label} variant={stage.variant} />}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {expense.project?.name ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {payrollRunId ? (
                    <Link
                      href={`/finance/payroll/${payrollRunId}`}
                      className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      <Banknote size={12} className="shrink-0 opacity-80" aria-hidden />
                      <span>{payrollMonth ?? 'Run'}</span>
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
