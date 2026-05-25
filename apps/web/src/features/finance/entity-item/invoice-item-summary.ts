import { FileText } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { formatAmount, getInvoiceMoneyStage } from '@/features/finance/constants/finance';

export type InvoicePreviewRow = {
  id: string;
  code: string;
  moneyStatus: string;
  amount: string | number;
  subtitle?: string;
};

/** Maps a lightweight invoice row to the shared entity tab preview model. */
export function invoicePreviewToItemSummary(row: InvoicePreviewRow): EntityItemSummary {
  const money = getInvoiceMoneyStage(row.moneyStatus);
  const amount = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount);
  return {
    id: row.id,
    kind: 'invoice',
    title: row.code,
    subtitle: row.subtitle ?? 'Invoice',
    status: money ? { label: money.label, variant: money.variant } : undefined,
    primaryMetric: formatAmount(amount),
    leadingIcon: FileText,
  };
}

/** Maps a subscription-linked invoice row to the shared entity tab preview model. */
export function subscriptionInvoiceToItemSummary(
  row: Pick<InvoicePreviewRow, 'id' | 'code' | 'moneyStatus' | 'amount'>,
): EntityItemSummary {
  return invoicePreviewToItemSummary(row);
}

/** Maps a deal order invoice row to the shared entity tab preview model. */
export function dealInvoiceToItemSummary(
  row: Pick<InvoicePreviewRow, 'id' | 'code' | 'moneyStatus' | 'amount'> & { orderCode: string },
): EntityItemSummary {
  return invoicePreviewToItemSummary({
    ...row,
    subtitle: row.orderCode,
  });
}
