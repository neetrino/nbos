const SATISFIED_ORDER_STATUSES = ['FULLY_PAID', 'CLOSED'] as const;
const SUBSCRIPTION_PAYMENT_TYPE = 'SUBSCRIPTION';

export interface OrderPaymentGateInput {
  status?: string | null;
  paymentType?: string | null;
}

/**
 * Classic orders must be fully paid or closed before delivery close.
 * Subscription orders skip this status gate; outstanding invoices are checked separately.
 */
export function isOrderPaymentGateSatisfied(
  order: OrderPaymentGateInput | null | undefined,
): boolean {
  if (!order?.status) return true;
  if (order.paymentType === SUBSCRIPTION_PAYMENT_TYPE) return true;
  return (SATISFIED_ORDER_STATUSES as readonly string[]).includes(order.status);
}
