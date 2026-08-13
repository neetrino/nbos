import type { Subscription } from '@/lib/api/finance';
import {
  CUSTOM_PREPAID_MONTH_MAX,
  CUSTOM_PREPAID_MONTH_MIN,
  DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
} from '@/features/finance/constants/finance';

export interface SubscriptionFormState {
  productId: string;
  projectId: string;
  type: string;
  amount: string;
  billingFrequency: string;
  coverageMonthCount: string;
  billingDay: string;
  billingStartDate: string;
  taxStatus: string;
  notificationsEnabled: boolean;
  reminderLanguage: string;
  endDate: string;
  partnerId: string;
}

export const EMPTY_SUBSCRIPTION_FORM: SubscriptionFormState = {
  productId: '',
  projectId: '',
  type: 'MAINTENANCE_ONLY',
  amount: '',
  billingFrequency: 'MONTHLY',
  coverageMonthCount: '',
  billingDay: '1',
  billingStartDate: '',
  taxStatus: 'TAX',
  notificationsEnabled: true,
  reminderLanguage: DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
  endDate: '',
  partnerId: '',
};

/** Label for the human-entered amount field based on selected billing period. */
export function getSubscriptionPeriodAmountLabel(billingFrequency: string): string {
  if (billingFrequency === 'YEARLY') return 'Amount / year';
  if (billingFrequency === 'CUSTOM') return 'Amount for period';
  return 'Amount / month';
}

export function parseCoverageMonthCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const value = parseInt(trimmed, 10);
  if (
    !Number.isInteger(value) ||
    value < CUSTOM_PREPAID_MONTH_MIN ||
    value > CUSTOM_PREPAID_MONTH_MAX
  ) {
    return null;
  }
  return value;
}

export function getSubscriptionBillingValidationError(
  form: Pick<SubscriptionFormState, 'billingFrequency' | 'coverageMonthCount'>,
): string | null {
  if (form.billingFrequency !== 'CUSTOM') return null;
  if (parseCoverageMonthCount(form.coverageMonthCount) != null) return null;
  return `Coverage month count is required for Custom billing (${CUSTOM_PREPAID_MONTH_MIN}–${CUSTOM_PREPAID_MONTH_MAX} months).`;
}

export function subscriptionToFormState(subscription: Subscription): SubscriptionFormState {
  return {
    productId: subscription.productId,
    projectId: subscription.projectId,
    type: subscription.type,
    amount: subscription.amount,
    billingFrequency: subscription.billingFrequency,
    coverageMonthCount:
      subscription.billingFrequency === 'CUSTOM' ? String(subscription.coverageMonthCount) : '',
    billingDay: String(subscription.billingDay),
    billingStartDate: subscription.billingStartDate.slice(0, 10),
    taxStatus: subscription.taxStatus,
    notificationsEnabled: subscription.notificationsEnabled,
    reminderLanguage: subscription.reminderLanguage ?? DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
    endDate: subscription.endDate ? subscription.endDate.slice(0, 10) : '',
    partnerId: subscription.partner?.id ?? '',
  };
}

function coverageMonthCountPayload(
  billingFrequency: string,
  coverageMonthCount: string,
): { coverageMonthCount: number } | Record<string, never> {
  if (billingFrequency !== 'CUSTOM') return {};
  const count = parseCoverageMonthCount(coverageMonthCount);
  if (count == null) return {};
  return { coverageMonthCount: count };
}

export function buildSubscriptionCreatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.amount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    productId: form.productId,
    ...(form.projectId.trim() ? { projectId: form.projectId.trim() } : {}),
    type: form.type,
    amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    ...coverageMonthCountPayload(form.billingFrequency, form.coverageMonthCount),
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    reminderLanguage: form.reminderLanguage,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : {}),
    ...(form.partnerId.trim() ? { partnerId: form.partnerId.trim() } : {}),
  };
}

export function buildSubscriptionUpdatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.amount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    type: form.type,
    ...(form.productId.trim()
      ? {
          productId: form.productId.trim(),
          ...(form.projectId.trim() ? { projectId: form.projectId.trim() } : {}),
        }
      : {}),
    amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    ...coverageMonthCountPayload(form.billingFrequency, form.coverageMonthCount),
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    reminderLanguage: form.reminderLanguage,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : { endDate: '' }),
    partnerId: form.partnerId.trim() ? form.partnerId.trim() : null,
  };
}
