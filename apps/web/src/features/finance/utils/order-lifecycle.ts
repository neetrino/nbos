import type { Order } from '@/lib/api/finance';

function invoiceCount(order: Order): number {
  return order._count?.invoices ?? order.invoices?.length ?? 0;
}

export function canHardDeleteOrder(order: Order): boolean {
  return order.status === 'PENDING_PAYMENT' && invoiceCount(order) === 0;
}

export function canCloseOrder(order: Order): boolean {
  if (order.status === 'CLOSED') return false;
  if (order.status === 'PENDING_PAYMENT' && invoiceCount(order) === 0) return false;
  return true;
}

export function orderLifecycleAction(order: Order): 'delete' | 'close' | null {
  if (canHardDeleteOrder(order)) return 'delete';
  if (canCloseOrder(order)) return 'close';
  return null;
}
