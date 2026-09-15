import { Receipt } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { formatAmount, getExpenseStage } from '@/features/finance/constants/finance';

export type ExpensePreviewRow = {
  id: string;
  name: string;
  status: string;
  amount: string | number;
  category?: string;
  dueDate?: string | null;
};

function formatExpensePreviewDue(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

/** Maps a lightweight expense row to the shared entity tab preview model. */
export function expensePreviewToItemSummary(row: ExpensePreviewRow): EntityItemSummary {
  const stage = getExpenseStage(row.status);
  const amount = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount);
  const dueLabel = row.dueDate ? formatExpensePreviewDue(row.dueDate) : null;
  return {
    id: row.id,
    kind: 'expense',
    title: row.name,
    subtitle: dueLabel ?? row.category ?? 'Expense',
    status: stage ? { label: stage.label, variant: stage.variant } : undefined,
    primaryMetric: formatAmount(amount),
    leadingIcon: Receipt,
  };
}
