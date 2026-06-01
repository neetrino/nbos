'use client';

import Link from 'next/link';
import { ExternalLink, Plus, Receipt } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { DetailSheetSection } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
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
  canCreate?: boolean;
  onCreateExpense: () => void;
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
  canCreate = true,
  onCreateExpense,
}: ClientServiceExpensesTabProps) {
  const expenses = links?.expenses ?? [];
  const expenseRows = mapExpenseRows(expenses, projectId);

  return (
    <div className="flex max-w-[48rem] flex-col gap-6">
      <DetailSheetSection title="Expense cards" icon={<Receipt size={12} />}>
        {canCreate ? (
          <div className="mb-4">
            <Button type="button" size="sm" onClick={onCreateExpense}>
              <Plus size={14} aria-hidden />
              Create expense
            </Button>
          </div>
        ) : null}
        <ClientServiceLinkedRecordList
          items={expenseRows}
          emptyIcon={Receipt}
          emptyTitle="No expense cards"
          emptyDescription="No expense cards linked to this service yet."
        />
        {expenses[0] ? (
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
