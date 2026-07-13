'use client';

import { FolderKanban } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared';
import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import {
  FINANCE_LIST_BADGE_CLASS,
  FINANCE_LIST_CELL_CLASS,
  FINANCE_LIST_HEAD_CLASS,
  FINANCE_LIST_ROW_HOVER_CLASS,
  FINANCE_LIST_SHELL_CLASS,
  FINANCE_LIST_TYPE_CLASS,
  FinanceListAmount,
  FinanceListDate,
  FinanceListIconLabel,
  FinanceListMutedDash,
  FinanceListPrimaryCell,
} from '@/features/finance/components/shared/finance-list-table';

interface ExpensePlansListTableProps {
  plans: ExpensePlan[];
  onOpen: (plan: ExpensePlan) => void;
}

/** List rows open the detail sheet on click (invoice list parity). */
export function ExpensePlansListTable({ plans, onOpen }: ExpensePlansListTableProps) {
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Name</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Category</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Amount</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Frequency</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Auto</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Next due</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>Project</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} text-right`}>Linked cards</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow
              key={plan.id}
              className={FINANCE_LIST_ROW_HOVER_CLASS}
              onClick={() => onOpen(plan)}
            >
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListPrimaryCell title={plan.name} />
              </TableCell>
              <TableCell className={`${FINANCE_LIST_CELL_CLASS} ${FINANCE_LIST_TYPE_CLASS}`}>
                {plan.category.replace(/_/g, ' ')}
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListAmount amount={plan.amount} />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <StatusBadge
                  label={expensePlanFrequencyLabel(plan.frequency)}
                  variant="blue"
                  className={FINANCE_LIST_BADGE_CLASS}
                />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                {plan.autoGenerate ? (
                  <StatusBadge label="Yes" variant="green" className={FINANCE_LIST_BADGE_CLASS} />
                ) : (
                  <FinanceListMutedDash />
                )}
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListDate value={plan.nextDueDate} />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                {plan.project ? (
                  <FinanceListIconLabel
                    icon={FolderKanban}
                    iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                    label={plan.project.code}
                  />
                ) : (
                  <FinanceListMutedDash />
                )}
              </TableCell>
              <TableCell className={`${FINANCE_LIST_CELL_CLASS} text-right text-sm font-semibold`}>
                {plan._count.expenses}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
