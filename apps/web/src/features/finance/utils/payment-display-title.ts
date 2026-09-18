import { formatAmount } from '@/features/finance/constants/finance';
import type { Payment } from '@/lib/api/finance';

/** Sheet / list title: amount, optionally with invoice code. */
export function getPaymentDisplayTitle(payment: Payment): string {
  const amountLabel = formatAmount(Number(payment.amount));
  const invoiceCode = payment.invoice?.code?.trim();
  if (invoiceCode) return `${amountLabel} · ${invoiceCode}`;
  return amountLabel;
}
