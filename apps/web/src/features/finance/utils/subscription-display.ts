export type SubscriptionDisplaySource = {
  name: string | null | undefined;
  code: string;
};

/** Primary subscription label — commercial name, falling back to system code. */
export function getSubscriptionDisplayTitle(subscription: SubscriptionDisplaySource): string {
  return subscription.name?.trim() || subscription.code;
}
