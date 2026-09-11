import type { Prisma, SubscriptionStatusEnum, SubscriptionTypeEnum } from '@nbos/database';

/** Hub: Product is on Maintenance iff a Subscription matches these types. */
export const PRODUCT_MAINTENANCE_SUBSCRIPTION_TYPES: readonly SubscriptionTypeEnum[] = [
  'MAINTENANCE_ONLY',
  'DEV_AND_MAINTENANCE',
];

/** Hub: live maintenance is PENDING (sold, not started) or ACTIVE. */
export const PRODUCT_MAINTENANCE_LIVE_STATUSES: readonly SubscriptionStatusEnum[] = [
  'PENDING',
  'ACTIVE',
];

export type ProductMaintenanceSubscriptionFacts = {
  type: string;
  status: string;
};

export function isLiveMaintenanceSubscription(
  subscription: ProductMaintenanceSubscriptionFacts,
): boolean {
  return (
    isMaintenanceSubscriptionType(subscription.type) &&
    isLiveMaintenanceSubscriptionStatus(subscription.status)
  );
}

export function isProductOnMaintenance(
  subscriptions: readonly ProductMaintenanceSubscriptionFacts[],
): boolean {
  return subscriptions.some(isLiveMaintenanceSubscription);
}

export function productMaintenanceSubscriptionFilter(): Prisma.SubscriptionWhereInput {
  return {
    type: { in: [...PRODUCT_MAINTENANCE_SUBSCRIPTION_TYPES] },
    status: { in: [...PRODUCT_MAINTENANCE_LIVE_STATUSES] },
  };
}

export function productOnMaintenanceWhere(): Prisma.ProductWhereInput {
  return { subscriptions: { some: productMaintenanceSubscriptionFilter() } };
}

export function productNotOnMaintenanceWhere(): Prisma.ProductWhereInput {
  return { subscriptions: { none: productMaintenanceSubscriptionFilter() } };
}

function isMaintenanceSubscriptionType(type: string): boolean {
  return (PRODUCT_MAINTENANCE_SUBSCRIPTION_TYPES as readonly string[]).includes(type);
}

function isLiveMaintenanceSubscriptionStatus(status: string): boolean {
  return (PRODUCT_MAINTENANCE_LIVE_STATUSES as readonly string[]).includes(status);
}
