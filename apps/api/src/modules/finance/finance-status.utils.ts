import type { InvoiceMoneyStatusEnum, PaymentTypeEnum } from '@nbos/database';

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

export type ResolvedOrderStatus = 'PENDING_PAYMENT' | 'FULLY_PAID' | 'PARTIALLY_PAID' | 'ACTIVE';

/** Optional order fields for term-subscription contract-total gating. */
export interface ResolveOrderStatusOrderContext {
  paymentType: PaymentTypeEnum;
  subscriptionTermMonths: number | null;
  totalAmount: number | string | DecimalValue;
}

function toFinanceNumber(amount: number | string | DecimalValue | null | undefined): number {
  if (amount && typeof amount === 'object') {
    return amount.toNumber();
  }
  return Number(amount ?? 0);
}

export function sumAmounts(items: FinanceAmountCarrier[]): number {
  return items.reduce((sum, item) => sum + toFinanceNumber(item.amount), 0);
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

function isTermSubscriptionOrder(
  order: ResolveOrderStatusOrderContext | null | undefined,
): boolean {
  return order?.paymentType === 'SUBSCRIPTION' && order.subscriptionTermMonths != null;
}

function resolveInvoiceDrivenOrderStatus(invoices: OrderInvoiceCarrier[]): ResolvedOrderStatus {
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

/**
 * Term subscription: FULLY_PAID only when received money on order-linked invoices
 * reaches `Order.totalAmount`. Billing invoices often lack `orderId`, so this path
 * conservatively refuses premature FULLY_PAID when only early periods are visible.
 */
function resolveTermSubscriptionOrderStatus(
  invoices: OrderInvoiceCarrier[],
  order: ResolveOrderStatusOrderContext,
): ResolvedOrderStatus {
  const received = invoices.reduce((sum, invoice) => sum + sumAmounts(invoice.payments), 0);
  const contractTotal = toFinanceNumber(order.totalAmount);

  if (received >= contractTotal) {
    return 'FULLY_PAID';
  }

  if (received > 0) {
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

export function resolveOrderStatus(
  invoices: OrderInvoiceCarrier[],
  order?: ResolveOrderStatusOrderContext | null,
): ResolvedOrderStatus {
  if (isTermSubscriptionOrder(order) && order) {
    return resolveTermSubscriptionOrderStatus(invoices, order);
  }

  return resolveInvoiceDrivenOrderStatus(invoices);
}
