import { CheckSquare } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { invoicePreviewToItemSummary } from '@/features/finance/entity-item/invoice-item-summary';
import { expensePreviewToItemSummary } from '@/features/finance/entity-item/expense-item-summary';
import { getTaskStatus } from '@/features/tasks/constants/tasks';
import type { ClientServiceFinanceLinks } from '@/lib/api/client-services';

type ClientServiceInvoiceLink = ClientServiceFinanceLinks['invoices'][number];
type ClientServiceExpenseLink = ClientServiceFinanceLinks['expenses'][number];
type ClientServiceTaskLink = ClientServiceFinanceLinks['tasks'][number];

/** Maps a client-service invoice link row to the shared entity tab preview model. */
export function clientServiceInvoiceLinkToItemSummary(
  row: ClientServiceInvoiceLink,
): EntityItemSummary {
  return invoicePreviewToItemSummary(row);
}

/** Maps a client-service expense link row to the shared entity tab preview model. */
export function clientServiceExpenseLinkToItemSummary(
  row: ClientServiceExpenseLink,
): EntityItemSummary {
  return expensePreviewToItemSummary(row);
}

function formatTaskDueDate(value: string | null): string | undefined {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString();
}

/** Maps a client-service task link row to the shared entity tab preview model. */
export function clientServiceTaskLinkToItemSummary(row: ClientServiceTaskLink): EntityItemSummary {
  const statusInfo = getTaskStatus(row.status);
  return {
    id: row.id,
    kind: 'task',
    title: row.title,
    status: statusInfo ? { label: statusInfo.label, variant: statusInfo.variant } : undefined,
    trailing: formatTaskDueDate(row.dueDate),
    leadingIcon: CheckSquare,
  };
}
