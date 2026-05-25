import type { SubscriptionTypePresentation } from '@/lib/subscription-type-visual';

const STATUS_ROW_ACCENT: Record<string, string> = {
  PENDING: 'border-l-amber-500/80',
  ACTIVE: 'border-l-green-500/80',
  ON_HOLD: 'border-l-muted-foreground/50',
  CANCELLED: 'border-l-red-500/70',
  COMPLETED: 'border-l-blue-500/70',
};

export function subscriptionRowAccentClassName(
  status: string,
  typeVisual: SubscriptionTypePresentation,
): string {
  return STATUS_ROW_ACCENT[status] ?? typeVisual.rowAccentClassName;
}
