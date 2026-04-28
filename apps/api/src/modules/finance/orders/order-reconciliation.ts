import { sumAmounts } from '../finance-status.utils';

interface OrderInvoiceForReconciliation {
  amount: number | string | { toNumber(): number } | null | undefined;
  payments?: Array<{ amount: number | string | { toNumber(): number } | null | undefined }>;
}

interface OrderForReconciliation {
  totalAmount: number | string | { toNumber(): number };
  invoices?: OrderInvoiceForReconciliation[];
  _count?: { invoices?: number };
}

export interface OrderReconciliationWarning {
  code: 'NO_INVOICES' | 'UNINVOICED_AMOUNT' | 'OUTSTANDING_AMOUNT';
  message: string;
}

export interface OrderReconciliation {
  orderAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  uninvoicedAmount: number;
  outstandingAmount: number;
  invoiceCount: number;
  isFullyInvoiced: boolean;
  isFullyPaid: boolean;
  warnings: OrderReconciliationWarning[];
}

export function buildOrderReconciliation(order: OrderForReconciliation): OrderReconciliation {
  const orderAmount = toNumber(order.totalAmount);
  const invoices = order.invoices ?? [];
  const invoicedAmount = sumAmounts(invoices);
  const paidAmount = invoices.reduce((sum, invoice) => sum + sumAmounts(invoice.payments ?? []), 0);
  const uninvoicedAmount = Math.max(0, orderAmount - invoicedAmount);
  const outstandingAmount = Math.max(0, orderAmount - paidAmount);
  const invoiceCount = order._count?.invoices ?? invoices.length;

  return {
    orderAmount,
    invoicedAmount,
    paidAmount,
    uninvoicedAmount,
    outstandingAmount,
    invoiceCount,
    isFullyInvoiced: invoicedAmount >= orderAmount,
    isFullyPaid: paidAmount >= orderAmount,
    warnings: buildWarnings({ invoiceCount, uninvoicedAmount, outstandingAmount }),
  };
}

export function attachOrderReconciliation<T extends OrderForReconciliation>(order: T) {
  return { ...order, reconciliation: buildOrderReconciliation(order) };
}

function buildWarnings({
  invoiceCount,
  uninvoicedAmount,
  outstandingAmount,
}: {
  invoiceCount: number;
  uninvoicedAmount: number;
  outstandingAmount: number;
}): OrderReconciliationWarning[] {
  if (invoiceCount === 0) {
    return [{ code: 'NO_INVOICES', message: 'Order has no linked invoices yet.' }];
  }

  return [
    ...(uninvoicedAmount > 0
      ? [{ code: 'UNINVOICED_AMOUNT' as const, message: 'Order is not fully invoiced.' }]
      : []),
    ...(outstandingAmount > 0
      ? [{ code: 'OUTSTANDING_AMOUNT' as const, message: 'Order is not fully paid.' }]
      : []),
  ];
}

function toNumber(value: number | string | { toNumber(): number }): number {
  return typeof value === 'object' ? value.toNumber() : Number(value);
}
