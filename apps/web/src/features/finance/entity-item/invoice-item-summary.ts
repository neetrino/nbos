import { FileText } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { formatAmount, getInvoiceMoneyStage } from '@/features/finance/constants/finance';
import {
  getInvoiceDisplaySubtitle,
  getInvoiceDisplayTitle,
  type InvoiceDisplaySource,
} from '@/features/finance/utils/order-display';

export type InvoicePreviewRow = InvoiceDisplaySource & {
  id: string;
  moneyStatus: string;
  amount: string | number;
  /** Fallback meta when invoice code is already the primary title. */
  metaSubtitle?: string;
};

/** Maps a lightweight invoice row to the shared entity tab preview model. */
export function invoicePreviewToItemSummary(row: InvoicePreviewRow): EntityItemSummary {
  const money = getInvoiceMoneyStage(row.moneyStatus);
  const amount = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount);
  const title = getInvoiceDisplayTitle(row);
  const codeSubtitle = getInvoiceDisplaySubtitle(row);
  return {
    id: row.id,
    kind: 'invoice',
    title,
    subtitle: codeSubtitle ?? row.metaSubtitle ?? 'Invoice',
    status: money ? { label: money.label, variant: money.variant } : undefined,
    primaryMetric: formatAmount(amount),
    leadingIcon: FileText,
  };
}

/** Maps a subscription-linked invoice row to the shared entity tab preview model. */
export function subscriptionInvoiceToItemSummary(
  row: Pick<InvoicePreviewRow, 'id' | 'code' | 'moneyStatus' | 'amount'>,
  subscription: InvoiceDisplaySource['subscription'],
): EntityItemSummary {
  return invoicePreviewToItemSummary({ ...row, subscription });
}

/** Maps a deal order invoice row to the shared entity tab preview model. */
export function dealInvoiceToItemSummary(
  row: Pick<InvoicePreviewRow, 'id' | 'code' | 'moneyStatus' | 'amount'>,
  order: InvoiceDisplaySource['order'],
): EntityItemSummary {
  return invoicePreviewToItemSummary({ ...row, order });
}

/** Maps an order-linked invoice row to the shared entity tab preview model. */
export function orderInvoiceToItemSummary(
  row: Pick<InvoicePreviewRow, 'id' | 'code' | 'moneyStatus' | 'amount'>,
  order: NonNullable<InvoiceDisplaySource['order']>,
): EntityItemSummary {
  return invoicePreviewToItemSummary({ ...row, order });
}
