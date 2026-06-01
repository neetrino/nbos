'use client';

import Link from 'next/link';
import { ExternalLink, ListChecks, Plus, Receipt } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { DetailSheetSection } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import { expenseDetailHref } from '@/features/finance/constants/project-expenses-drilldown';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';
import {
  ClientServiceLinkedRecordList,
  type ClientServiceLinkedRecordRow,
} from './ClientServiceLinkedRecordList';

interface ClientServiceExpensesTabProps {
  links: ClientServiceFinanceLinks | undefined;
  projectId: string;
  onCreatePlan: () => void;
  onCreateExpense: () => void;
}

function mapExpensePlanRows(
  plans: ClientServiceFinanceLinks['expensePlans'],
): ClientServiceLinkedRecordRow[] {
  return plans.map((plan) => ({
    id: plan.id,
    href: expensePlansListWithOpenPlanHref(plan.id),
    title: plan.name,
    subtitle: plan.category,
    metric: formatAmount(Number(plan.amount)),
    leadingIcon: ListChecks,
  }));
}

function mapExpenseRows(
  expenses: ClientServiceFinanceLinks['expenses'],
  projectId: string,
): ClientServiceLinkedRecordRow[] {
  return expenses.map((exp) => ({
    id: exp.id,
    href: expenseDetailHref(exp.id, projectId),
    title: exp.name,
    subtitle: exp.category,
    statusLabel: exp.status,
    metric: formatAmount(Number(exp.amount)),
    leadingIcon: Receipt,
  }));
}

export function ClientServiceExpensesTab({
  links,
  projectId,
  onCreatePlan,
  onCreateExpense,
}: ClientServiceExpensesTabProps) {
  const plans = links?.expensePlans ?? [];
  const expenses = links?.expenses ?? [];
  const planRows = mapExpensePlanRows(plans);
  const expenseRows = mapExpenseRows(expenses, projectId);

  return (
    <div className="flex max-w-[48rem] flex-col gap-6">
      <DetailSheetSection title="Expense plans" icon={<ListChecks size={12} />}>
        <div className="mb-4">
          <Button type="button" size="sm" onClick={onCreatePlan}>
            <Plus size={14} aria-hidden />
            Create expense plan
          </Button>
        </div>
        <ClientServiceLinkedRecordList
          items={planRows}
          emptyIcon={ListChecks}
          emptyTitle="No expense plans"
          emptyDescription="No expense plans linked to this service yet."
        />
      </DetailSheetSection>

      <DetailSheetSection title="Expense cards" icon={<Receipt size={12} />}>
        <div className="mb-4">
          <Button type="button" size="sm" onClick={onCreateExpense}>
            <Plus size={14} aria-hidden />
            Create expense
          </Button>
        </div>
        <ClientServiceLinkedRecordList
          items={expenseRows}
          emptyIcon={Receipt}
          emptyTitle="No expense cards"
          emptyDescription="No expense cards linked to this service yet."
        />
        {expenses.length > 0 ? (
          <Link
            href={expenseDetailHref(expenses[0].id, projectId)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 gap-1.5')}
          >
            <Receipt size={14} aria-hidden />
            Open in Finance
            <ExternalLink size={12} className="opacity-70" aria-hidden />
          </Link>
        ) : null}
      </DetailSheetSection>
    </div>
  );
}
