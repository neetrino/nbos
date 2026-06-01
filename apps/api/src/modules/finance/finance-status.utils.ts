import type { InvoiceMoneyStatusEnum } from '@nbos/database';

/** Row shape accepted by `sumAmounts` (invoice lines, payments, etc.). */
export interface FinanceAmountCarrier {
  amount: number | string | DecimalValue | null | undefined;
}

interface PaymentCarrier extends FinanceAmountCarrier {
  paymentDate?: Date | null;
}

interface OrderInvoiceCarrier {
  moneyStatus: InvoiceMoneyStatusEnum;
  payments: PaymentCarrier[];
}

interface DecimalValue {
  toNumber: () => number;
}

export function sumAmounts(items: FinanceAmountCarrier[]): number {
  return items.reduce((sum, item) => {
    const amount = item.amount;
    const numericAmount =
      amount && typeof amount === 'object' ? amount.toNumber() : Number(amount ?? 0);

    return sum + numericAmount;
  }, 0);
}

export function getLatestPaymentDate(payments: PaymentCarrier[]): Date | null {
  const timestamps = payments
    .map((payment) => payment.paymentDate?.getTime() ?? null)
    .filter((timestamp): timestamp is number => timestamp !== null);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

export function resolveOrderStatus(
  invoices: OrderInvoiceCarrier[],
): 'PENDING_PAYMENT' | 'FULLY_PAID' | 'PARTIALLY_PAID' | 'ACTIVE' {
  const allPaid = invoices.every((invoice) => invoice.moneyStatus === 'PAID');
  if (allPaid) {
    return 'FULLY_PAID';
  }

  const somePaid = invoices.some((invoice) => sumAmounts(invoice.payments) > 0);
  if (somePaid) {
    return 'PARTIALLY_PAID';
  }

  const hasAwaiting = invoices.some(
    (invoice) => invoice.moneyStatus !== 'PAID' && invoice.moneyStatus !== 'CANCELLED',
  );
  if (hasAwaiting) {
    return 'PENDING_PAYMENT';
  }

  return 'ACTIVE';
}
