import { sumAmounts } from '../finance-status.utils';

interface InvoiceForPaymentCoverage {
  amount: number | string | { toNumber(): number };
  payments?: Array<{ amount: number | string | { toNumber(): number } | null }>;
  _count?: { payments?: number };
}

export interface InvoicePaymentCoverage {
  paidAmount: number;
  outstandingAmount: number;
  paymentCount: number;
  isFullyPaid: boolean;
}

export function buildInvoicePaymentCoverage(
  invoice: InvoiceForPaymentCoverage,
): InvoicePaymentCoverage {
  const amount = toNumber(invoice.amount);
  const paidAmount = sumAmounts(invoice.payments ?? []);
  const outstandingAmount = Math.max(0, amount - paidAmount);

  return {
    paidAmount,
    outstandingAmount,
    paymentCount: invoice._count?.payments ?? invoice.payments?.length ?? 0,
    isFullyPaid: paidAmount >= amount,
  };
}

export function attachInvoicePaymentCoverage<T extends InvoiceForPaymentCoverage>(invoice: T) {
  return { ...invoice, paymentCoverage: buildInvoicePaymentCoverage(invoice) };
}

function toNumber(value: number | string | { toNumber(): number }): number {
  return typeof value === 'object' ? value.toNumber() : Number(value);
}
