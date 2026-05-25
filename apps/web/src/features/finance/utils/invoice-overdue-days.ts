import type { Invoice } from '@/lib/api/finance';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days past due date; 0 when not overdue or already paid. */
export function resolveInvoiceOverdueDays(invoice: Invoice): number {
  if (!invoice.dueDate || invoice.moneyStatus === 'PAID') {
    return 0;
  }

  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  dueDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / MS_PER_DAY));
}
