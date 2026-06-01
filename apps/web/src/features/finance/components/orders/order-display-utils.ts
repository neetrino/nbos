import { formatAmount } from '@/features/finance/constants/finance';
import type { Order } from '@/lib/api/finance';

export function getOrderTotalAmount(order: Order): number {
  return Number(order.amount ?? order.totalAmount ?? 0);
}

export function formatOrderShortDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

export function getOrderCoveragePercents(order: Order): {
  invoicedPercent: number;
  paidPercent: number;
} | null {
  const reconciliation = order.reconciliation;
  if (!reconciliation || reconciliation.orderAmount <= 0) {
    return null;
  }

  return {
    invoicedPercent: toPercent(reconciliation.invoicedAmount, reconciliation.orderAmount),
    paidPercent: toPercent(reconciliation.paidAmount, reconciliation.orderAmount),
  };
}

export function formatOrderPaidSubline(order: Order): string | null {
  const total = getOrderTotalAmount(order);
  const paid = order.reconciliation?.paidAmount ?? order.paidAmount ?? 0;
  if (total <= 0 || paid <= 0 || paid >= total) {
    return null;
  }
  return `Paid ${formatAmount(paid)}`;
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
