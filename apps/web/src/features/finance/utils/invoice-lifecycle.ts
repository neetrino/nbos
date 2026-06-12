import type { Invoice } from '@/lib/api/finance';

function paymentCount(invoice: Invoice): number {
  return invoice._count?.payments ?? invoice.payments?.length ?? 0;
}

export function canHardDeleteInvoice(invoice: Invoice): boolean {
  return invoice.moneyStatus === 'NEW' && paymentCount(invoice) === 0;
}

export function canCancelInvoice(invoice: Invoice): boolean {
  return invoice.moneyStatus !== 'PAID' && invoice.moneyStatus !== 'CANCELLED';
}

export function invoiceLifecycleAction(invoice: Invoice): 'delete' | 'cancel' | null {
  if (canHardDeleteInvoice(invoice)) return 'delete';
  if (canCancelInvoice(invoice)) return 'cancel';
  return null;
}
