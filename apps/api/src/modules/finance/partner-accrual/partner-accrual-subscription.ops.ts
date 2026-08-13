import type { SubscriptionTypeEnum } from '@nbos/database';
import {
  isInboundDeliveryComplete,
  type InboundDeliveryCarrierOrder,
} from './partner-accrual-classic.ops';

const DEVELOPMENT_SUBSCRIPTION_TYPES = new Set<string>(['DEV_ONLY', 'DEV_AND_MAINTENANCE']);

export function isDevelopmentSubscriptionType(
  type: SubscriptionTypeEnum | string | null | undefined,
): type is 'DEV_ONLY' | 'DEV_AND_MAINTENANCE' {
  return type != null && DEVELOPMENT_SUBSCRIPTION_TYPES.has(type);
}

export function hasInboundDeliveryCarrier(order: {
  productId: string | null;
  extensionId: string | null;
}): boolean {
  return order.productId != null || order.extensionId != null;
}

/**
 * Hold DEV / DEV+maintenance subscription accruals until the linked product or extension is DONE.
 * Maintenance-only and partner-service have no delivery milestone — never hold.
 * No product/extension on the order: do not hold (nothing can ever release the row).
 */
export function shouldHoldSubscriptionAccrualUntilDelivery(input: {
  subscriptionType: SubscriptionTypeEnum | string | null | undefined;
  order: InboundDeliveryCarrierOrder;
}): boolean {
  if (!isDevelopmentSubscriptionType(input.subscriptionType)) return false;
  if (!hasInboundDeliveryCarrier(input.order)) return false;
  return !isInboundDeliveryComplete(input.order);
}

export function heldSubscriptionAccrualWhere(orderId: string) {
  return {
    orderId,
    status: 'ACCRUED' as const,
    subscriptionId: { not: null },
  };
}
