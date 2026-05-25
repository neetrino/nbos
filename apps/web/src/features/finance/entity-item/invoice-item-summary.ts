import { FileText } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { formatAmount, getInvoiceMoneyStage } from '@/features/finance/constants/finance';

type SubscriptionInvoiceRow = {
  id: string;
  code: string;
  moneyStatus: string;
  amount: string;
};

/** Maps a subscription-linked invoice row to the shared entity tab preview model. */
export function subscriptionInvoiceToItemSummary(row: SubscriptionInvoiceRow): EntityItemSummary {
  const money = getInvoiceMoneyStage(row.moneyStatus);
  return {
    id: row.id,
    kind: 'invoice',
    title: row.code,
    subtitle: 'Invoice',
    status: money ? { label: money.label, variant: money.variant } : undefined,
    primaryMetric: formatAmount(parseFloat(row.amount)),
    leadingIcon: FileText,
  };
}
