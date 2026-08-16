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

/** Optional order fields for contract-total gating (classic and term subscription). */
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

function isPositiveContractTotal(amount: ResolveOrderStatusOrderContext['totalAmount']): boolean {
  const contractTotal = toFinanceNumber(amount);
  return Number.isFinite(contractTotal) && contractTotal > 0;
}

function usesReceivedAgainstContractTotal(
  order: ResolveOrderStatusOrderContext | null | undefined,
): order is ResolveOrderStatusOrderContext {
  if (!order) return false;
  if (isTermSubscriptionOrder(order)) return true;
  return order.paymentType === 'CLASSIC' && isPositiveContractTotal(order.totalAmount);
}

function hasAwaitingPaymentInvoice(invoices: OrderInvoiceCarrier[]): boolean {
  return invoices.some(
    (invoice) => invoice.moneyStatus !== 'PAID' && invoice.moneyStatus !== 'CANCELLED',
  );
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

  if (hasAwaitingPaymentInvoice(invoices)) {
    return 'PENDING_PAYMENT';
  }

  return 'ACTIVE';
}

/**
 * FULLY_PAID only when received money on order-linked invoices reaches `contractTotal`.
 * Shared by CLASSIC (positive `Order.totalAmount`) and fixed-term subscription.
 */
function resolveReceivedAgainstContractStatus(
  invoices: OrderInvoiceCarrier[],
  contractTotal: number,
): ResolvedOrderStatus {
  const received = invoices.reduce((sum, invoice) => sum + sumAmounts(invoice.payments), 0);

  if (received >= contractTotal) {
    return 'FULLY_PAID';
  }

  if (received > 0) {
    return 'PARTIALLY_PAID';
  }

  if (hasAwaitingPaymentInvoice(invoices)) {
    return 'PENDING_PAYMENT';
  }

  return 'ACTIVE';
}

export function resolveOrderStatus(
  invoices: OrderInvoiceCarrier[],
  order?: ResolveOrderStatusOrderContext | null,
): ResolvedOrderStatus {
  if (usesReceivedAgainstContractTotal(order)) {
    return resolveReceivedAgainstContractStatus(invoices, toFinanceNumber(order.totalAmount));
  }

  return resolveInvoiceDrivenOrderStatus(invoices);
}
