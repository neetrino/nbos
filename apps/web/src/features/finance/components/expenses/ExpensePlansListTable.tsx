'use client';

import Link from 'next/link';
import { FileOutput, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlansListTableProps {
  plans: ExpensePlan[];
  onGenerate: (plan: ExpensePlan) => void;
  onDelete: (id: string, name: string) => void;
}

export function ExpensePlansListTable({ plans, onGenerate, onDelete }: ExpensePlansListTableProps) {
  return (
    <div className="border-border rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Auto</TableHead>
            <TableHead>Next due</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="text-right">Linked cards</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/finance/expenses/plans/${plan.id}`}
                  className="text-primary hover:underline"
                >
                  {plan.name}
                </Link>
              </TableCell>
              <TableCell>{plan.category}</TableCell>
              <TableCell>{formatAmount(Number(plan.amount))}</TableCell>
              <TableCell>{expensePlanFrequencyLabel(plan.frequency)}</TableCell>
              <TableCell>{plan.autoGenerate ? 'Yes' : '—'}</TableCell>
              <TableCell>{formatExpensePlanShortDate(plan.nextDueDate)}</TableCell>
              <TableCell>{plan.project ? `${plan.project.code}` : '—'}</TableCell>
              <TableCell className="text-right">{plan._count.expenses}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Generate expense from ${plan.name}`}
                    onClick={() => onGenerate(plan)}
                  >
                    <FileOutput size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${plan.name}`}
                    onClick={() => void onDelete(plan.id, plan.name)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
