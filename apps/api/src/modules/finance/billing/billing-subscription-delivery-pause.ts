import {
  DeliveryResolutionEnum,
  ExtensionStatusEnum,
  ProductStatusEnum,
  SubscriptionTypeEnum,
} from '@nbos/database';

/** Subscription kinds whose monthly amount covers in-flight development work (NBOS canon). */
export const SUBSCRIPTION_TYPES_SUBJECT_TO_DELIVERY_DEADLINE: SubscriptionTypeEnum[] = [
  SubscriptionTypeEnum.DEV_ONLY,
  SubscriptionTypeEnum.DEV_AND_MAINTENANCE,
];

export type ProductForBillingPause = {
  deadline: Date | null;
  status: ProductStatusEnum;
  deliveryResolution: DeliveryResolutionEnum | null;
  extensions: ExtensionForBillingPause[];
};

export type ExtensionForBillingPause = {
  deadline: Date | null;
  status: ExtensionStatusEnum;
  deliveryResolution: DeliveryResolutionEnum | null;
};

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isProductDeliveredOrAbandoned(
  status: ProductStatusEnum,
  resolution: DeliveryResolutionEnum | null,
): boolean {
  if (status === ProductStatusEnum.DONE || status === ProductStatusEnum.LOST) return true;
  if (resolution === DeliveryResolutionEnum.DONE) return true;
  if (resolution === DeliveryResolutionEnum.CANCELLED) return true;
  return false;
}

function isExtensionDeliveredOrAbandoned(
  status: ExtensionStatusEnum,
  resolution: DeliveryResolutionEnum | null,
): boolean {
  if (status === ExtensionStatusEnum.DONE || status === ExtensionStatusEnum.LOST) return true;
  if (resolution === DeliveryResolutionEnum.DONE) return true;
  if (resolution === DeliveryResolutionEnum.CANCELLED) return true;
  return false;
}

function isUndeliveredAfterDeadline(
  deadline: Date | null,
  deliveredOrAbandoned: boolean,
  billingDate: Date,
): boolean {
  if (!deadline || deliveredOrAbandoned) return false;
  return toDateKey(billingDate) > toDateKey(deadline);
}

/**
 * When true, monthly subscription invoice generation must be skipped for this cycle:
 * development-priced subscription while at least one in-scope Product or Extension
 * is past its deadline and not delivered / not abandoned.
 */
export function subscriptionBillingPausedForLateDelivery(input: {
  subscriptionType: SubscriptionTypeEnum;
  products: ProductForBillingPause[];
  billingDate: Date;
}): boolean {
  if (!SUBSCRIPTION_TYPES_SUBJECT_TO_DELIVERY_DEADLINE.includes(input.subscriptionType)) {
    return false;
  }
  if (input.products.length === 0) return false;

  for (const p of input.products) {
    const productLate = isUndeliveredAfterDeadline(
      p.deadline,
      isProductDeliveredOrAbandoned(p.status, p.deliveryResolution),
      input.billingDate,
    );
    if (productLate) return true;

    for (const x of p.extensions) {
      const extLate = isUndeliveredAfterDeadline(
        x.deadline,
        isExtensionDeliveredOrAbandoned(x.status, x.deliveryResolution),
        input.billingDate,
      );
      if (extLate) return true;
    }
  }

  return false;
}
