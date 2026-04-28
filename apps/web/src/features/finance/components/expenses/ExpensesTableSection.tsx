'use client';

import Link from 'next/link';
import { DollarSign } from 'lucide-react';
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
import type { Expense } from '@/lib/api/finance';

interface ExpensesTableSectionProps {
  expenses: Expense[];
}

export function ExpensesTableSection({ expenses }: ExpensesTableSectionProps) {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const stage = getExpenseStage(expense.status);
            return (
              <TableRow key={expense.id}>
                <TableCell>
                  <Link
                    href={`/finance/expenses/${expense.id}`}
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
