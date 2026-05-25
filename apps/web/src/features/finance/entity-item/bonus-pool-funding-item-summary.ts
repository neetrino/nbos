import { ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import type { EntityItemSummary } from '@/components/shared/entity-item';
import { formatBonusPoolMoney } from '@/features/finance/utils/bonus-pool-amount';
import type { BonusPoolTimelineEvent } from '@/lib/api/bonus';

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function releaseStatusVariant(status: string | null): 'green' | 'amber' | 'blue' | 'gray' | 'red' {
  if (status === 'PAID') return 'green';
  if (status === 'INCLUDED_IN_PAYROLL') return 'blue';
  if (status === 'APPROVED') return 'amber';
  if (status === 'CANCELLED') return 'red';
  return 'gray';
}

/** Client payment timeline row — opens invoice sheet when invoiceId is present. */
export function bonusPoolPaymentToItemSummary(
  event: BonusPoolTimelineEvent,
): EntityItemSummary | null {
  if (event.kind !== 'PAYMENT_IN') return null;
  return {
    id: event.invoiceId ?? event.id,
    kind: 'invoice',
    title: event.label,
    subtitle: event.orderCode ? `Order ${event.orderCode}` : 'Client payment',
    primaryMetric: `+${formatBonusPoolMoney(event.amount)}`,
    trailing: formatEventDate(event.occurredAt),
    leadingIcon: FileText,
    meta: event.orderCode ? [{ icon: ArrowDownLeft, text: event.orderCode }] : undefined,
  };
}

/** Bonus release timeline row — opens bonus entry release sheet. */
export function bonusPoolReleaseToItemSummary(
  event: BonusPoolTimelineEvent,
): EntityItemSummary | null {
  if (event.kind !== 'RELEASE_OUT' || !event.bonusEntryId) return null;
  return {
    id: event.bonusEntryId,
    kind: 'bonus_entry',
    title: event.employeeName ?? event.label,
    subtitle: event.label,
    status: event.releaseStatus
      ? {
          label: event.releaseStatus.replaceAll('_', ' '),
          variant: releaseStatusVariant(event.releaseStatus),
        }
      : undefined,
    primaryMetric: `−${formatBonusPoolMoney(event.amount)}`,
    trailing: formatEventDate(event.occurredAt),
    leadingIcon: ArrowUpRight,
    meta: event.orderCode ? [{ text: event.orderCode }] : undefined,
  };
}
