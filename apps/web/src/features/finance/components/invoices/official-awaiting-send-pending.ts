import {
  getOfficialInvoiceOrderCommentSendErrors,
  getOfficialInvoiceRequestSendErrors,
} from '@nbos/shared';
import type { Invoice } from '@/lib/api/finance';

type PendingListener = () => void;

const pendingInvoiceIds = new Set<string>();
const listeners = new Set<PendingListener>();

function notifyOfficialAwaitingSendPending(): void {
  for (const listener of listeners) listener();
}

export function markOfficialAwaitingSendPending(invoiceId: string): void {
  pendingInvoiceIds.add(invoiceId);
  notifyOfficialAwaitingSendPending();
}

export function clearOfficialAwaitingSendPending(invoiceId: string): void {
  if (!pendingInvoiceIds.delete(invoiceId)) return;
  notifyOfficialAwaitingSendPending();
}

export function isOfficialAwaitingSendPending(invoiceId: string): boolean {
  return pendingInvoiceIds.has(invoiceId);
}

export function subscribeOfficialAwaitingSendPending(listener: PendingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function shouldMarkOfficialAwaitingSendPending(
  invoice: Invoice,
  targetMoneyStatus: string,
): boolean {
  if (invoice.taxStatus !== 'TAX') return false;
  if (targetMoneyStatus !== 'AWAITING_PAYMENT') return false;
  if (invoice.officialInvoiceRequestSent) return false;
  if (
    getOfficialInvoiceRequestSendErrors({
      taxStatus: invoice.taxStatus,
      companyId: invoice.companyId,
      company: invoice.company,
    }).length > 0
  ) {
    return false;
  }
  return (
    getOfficialInvoiceOrderCommentSendErrors({
      orderId: invoice.orderId,
      orderComment: invoice.orderComment,
    }).length === 0
  );
}

export async function withOfficialAwaitingSendPending(
  invoice: Invoice | undefined,
  targetMoneyStatus: string,
  run: () => Promise<void>,
): Promise<void> {
  const pending =
    invoice != null && shouldMarkOfficialAwaitingSendPending(invoice, targetMoneyStatus);
  if (pending && invoice) markOfficialAwaitingSendPending(invoice.id);
  try {
    await run();
  } finally {
    if (pending && invoice) clearOfficialAwaitingSendPending(invoice.id);
  }
}
