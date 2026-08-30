import { getSubscriptionBillingFrequency } from '@/features/finance/constants/finance';

const GRID_META_SEPARATOR = ' · ';

export type SubscriptionDisplaySource = {
  name: string | null | undefined;
  code: string;
};

export type SubscriptionGridRowMetaSource = {
  billingDay: number;
  billingFrequency: string;
  coverageMonthCount: number;
};

/** Primary subscription label — commercial name, falling back to system code. */
export function getSubscriptionDisplayTitle(subscription: SubscriptionDisplaySource): string {
  return subscription.name?.trim() || subscription.code;
}

function compactFrequencyLabel(billingFrequency: string, coverageMonthCount: number): string {
  if (billingFrequency === 'CUSTOM') {
    return `${coverageMonthCount} mo`;
  }
  return getSubscriptionBillingFrequency(billingFrequency)?.label ?? billingFrequency;
}

/** One-line grid meta: billing day + frequency. */
export function formatSubscriptionGridRowMeta(
  subscription: SubscriptionGridRowMetaSource,
): { text: string; title: string } {
  const frequency = compactFrequencyLabel(
    subscription.billingFrequency,
    subscription.coverageMonthCount,
  );
  const text = `${subscription.billingDay}${GRID_META_SEPARATOR}${frequency}`;
  return {
    text,
    title: `Billing day ${subscription.billingDay}${GRID_META_SEPARATOR}${frequency}`,
  };
}
