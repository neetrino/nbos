'use client';

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
  onOpen: (plan: ExpensePlan) => void;
}

/** List rows open the detail sheet on click (invoice list parity). */
export function ExpensePlansListTable({ plans, onOpen }: ExpensePlansListTableProps) {
  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Auto</TableHead>
            <TableHead>Next due</TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="text-right">Linked cards</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} className="cursor-pointer" onClick={() => onOpen(plan)}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell className="text-muted-foreground">{plan.category}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatAmount(Number(plan.amount))}
              </TableCell>
              <TableCell>{expensePlanFrequencyLabel(plan.frequency)}</TableCell>
              <TableCell>{plan.autoGenerate ? 'Yes' : '—'}</TableCell>
              <TableCell>{formatExpensePlanShortDate(plan.nextDueDate)}</TableCell>
              <TableCell>{plan.project ? plan.project.code : '—'}</TableCell>
              <TableCell className="text-right">{plan._count.expenses}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
