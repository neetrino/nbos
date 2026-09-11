import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';

export interface SubscriptionCoverageGridViewProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: SubscriptionGridPayload;
  subscriptions: Subscription[];
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

export interface SubscriptionCalendarMonthLabel {
  key: number;
  label: string;
}
