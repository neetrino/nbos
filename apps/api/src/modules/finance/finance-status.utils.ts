import type { InvoiceStatusEnum } from '@nbos/database';

interface AmountCarrier {
  amount: number | string | null | undefined;
}

interface PaymentCarrier extends AmountCarrier {
  paymentDate?: Date | null;
}

interface OrderInvoiceCarrier {
  status: string;
  payments: PaymentCarrier[];
}

interface BaseInvoiceStatusArgs {
  amount: number;
  paid: number;
  dueDate: Date | null;
}

interface InvoiceStatusArgs extends BaseInvoiceStatusArgs {
  currentStatus: InvoiceStatusEnum;
}

export function sumAmounts(items: AmountCarrier[]): number {
  return items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
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

export function resolveBaseInvoiceStatus(args: BaseInvoiceStatusArgs): InvoiceStatusEnum {
  const { amount, paid, dueDate } = args;

  if (paid >= amount) {
    return 'PAID';
  }

  if (!dueDate) {
    return paid > 0 ? 'WAITING' : 'THIS_MONTH';
  }

  return dueDate.getTime() < Date.now() ? 'DELAYED' : 'WAITING';
}

export function resolveInvoiceStatus(args: InvoiceStatusArgs): InvoiceStatusEnum {
  const { currentStatus, ...baseArgs } = args;

  if (currentStatus === 'ON_HOLD' || currentStatus === 'FAIL') {
    return currentStatus;
  }

  return resolveBaseInvoiceStatus(baseArgs);
}

export function resolveOrderStatus(
  invoices: OrderInvoiceCarrier[],
): 'FULLY_PAID' | 'PARTIALLY_PAID' | 'ACTIVE' {
  const allPaid = invoices.every((invoice) => invoice.status === 'PAID');
  if (allPaid) {
    return 'FULLY_PAID';
  }

  const somePaid = invoices.some((invoice) => sumAmounts(invoice.payments) > 0);
  if (somePaid) {
    return 'PARTIALLY_PAID';
  }

  return 'ACTIVE';
}
