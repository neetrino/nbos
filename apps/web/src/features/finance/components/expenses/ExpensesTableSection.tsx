'use client';

import Link from 'next/link';
import { DollarSign, MoreHorizontal } from 'lucide-react';
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
import { getExpenseStage, formatAmount } from '@/features/finance/constants/finance';
import { expenseDetailHref } from '@/features/finance/constants/project-expenses-drilldown';
import type { Expense } from '@/lib/api/finance';

interface ExpensesTableSectionProps {
  expenses: Expense[];
  /** When set, row links include `?projectId=` for back-navigation parity. */
  listProjectId?: string | null;
  onRequestDelete: (expense: Expense) => void;
}

export function ExpensesTableSection({
  expenses,
  listProjectId,
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
            <TableHead>Status</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[52px] text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const stage = getExpenseStage(expense.status);
            return (
              <TableRow key={expense.id}>
                <TableCell>
                  <Link
                    href={expenseDetailHref(expense.id, listProjectId)}
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
                <TableCell>
                  {stage && <StatusBadge label={stage.label} variant={stage.variant} />}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {expense.project?.name ?? '—'}
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
