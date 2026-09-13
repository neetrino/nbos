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
import { getExpensePlanStatus } from '@/features/finance/constants/expense-plan-status';
import { getExpenseCategoryLabel } from '@/features/finance/constants/expense-category-visual';
import {
  translateExpensePlanCategory,
  translateExpensePlanFrequency,
  translateExpensePlanStatus,
  useExpensePlansT,
} from './expense-plan-message-keys';
import { expenseOwnerLabel } from '@/features/finance/utils/expense-owner-label';
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
  const t = useExpensePlansT();
  return (
    <div className={FINANCE_LIST_SHELL_CLASS}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.name')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.status')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.category')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.amount')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.frequency')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.auto')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.nextDue')}</TableHead>
            <TableHead className={FINANCE_LIST_HEAD_CLASS}>{t('table.project')}</TableHead>
            <TableHead className={`${FINANCE_LIST_HEAD_CLASS} text-right`}>
              {t('table.linkedCards')}
            </TableHead>
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
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <StatusBadge
                  label={translateExpensePlanStatus(
                    t,
                    plan.status,
                    getExpensePlanStatus(plan.status)?.label ?? plan.status,
                  )}
                  variant={getExpensePlanStatus(plan.status)?.variant ?? 'gray'}
                  className={FINANCE_LIST_BADGE_CLASS}
                />
              </TableCell>
              <TableCell className={`${FINANCE_LIST_CELL_CLASS} ${FINANCE_LIST_TYPE_CLASS}`}>
                {translateExpensePlanCategory(t, plan.category, getExpenseCategoryLabel(plan.category))}
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListAmount amount={plan.amount} />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <StatusBadge
                  label={translateExpensePlanFrequency(t, plan.frequency)}
                  variant="blue"
                  className={FINANCE_LIST_BADGE_CLASS}
                />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                {plan.autoGenerate ? (
                  <StatusBadge label={t('table.yes')} variant="green" className={FINANCE_LIST_BADGE_CLASS} />
                ) : (
                  <FinanceListMutedDash />
                )}
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                <FinanceListDate value={plan.nextDueDate} />
              </TableCell>
              <TableCell className={FINANCE_LIST_CELL_CLASS}>
                {expenseOwnerLabel(plan) ? (
                  <FinanceListIconLabel
                    icon={FolderKanban}
                    iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                    label={expenseOwnerLabel(plan)!}
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
