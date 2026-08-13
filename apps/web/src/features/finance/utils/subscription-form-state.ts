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
  baseMonthlyAmount: string;
  billingFrequency: string;
  prepaidMonthCount: string;
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
  baseMonthlyAmount: '',
  billingFrequency: 'MONTHLY',
  prepaidMonthCount: '',
  billingDay: '1',
  billingStartDate: '',
  taxStatus: 'TAX',
  notificationsEnabled: true,
  reminderLanguage: DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
  endDate: '',
  partnerId: '',
};

export function parsePrepaidMonthCount(raw: string): number | null {
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
  form: Pick<SubscriptionFormState, 'billingFrequency' | 'prepaidMonthCount'>,
): string | null {
  if (form.billingFrequency !== 'CUSTOM') return null;
  if (parsePrepaidMonthCount(form.prepaidMonthCount) != null) return null;
  return `Prepaid month count is required for Custom billing (${CUSTOM_PREPAID_MONTH_MIN}–${CUSTOM_PREPAID_MONTH_MAX} months).`;
}

export function subscriptionToFormState(subscription: Subscription): SubscriptionFormState {
  return {
    productId: subscription.productId,
    projectId: subscription.projectId,
    type: subscription.type,
    baseMonthlyAmount: subscription.baseMonthlyAmount,
    billingFrequency: subscription.billingFrequency,
    prepaidMonthCount:
      subscription.prepaidMonthCount != null ? String(subscription.prepaidMonthCount) : '',
    billingDay: String(subscription.billingDay),
    billingStartDate: subscription.billingStartDate.slice(0, 10),
    taxStatus: subscription.taxStatus,
    notificationsEnabled: subscription.notificationsEnabled,
    reminderLanguage: subscription.reminderLanguage ?? DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
    endDate: subscription.endDate ? subscription.endDate.slice(0, 10) : '',
    partnerId: subscription.partner?.id ?? '',
  };
}

function prepaidMonthCountPayload(
  billingFrequency: string,
  prepaidMonthCount: string,
): { prepaidMonthCount: number } | Record<string, never> {
  if (billingFrequency !== 'CUSTOM') return {};
  const count = parsePrepaidMonthCount(prepaidMonthCount);
  if (count == null) return {};
  return { prepaidMonthCount: count };
}

export function buildSubscriptionCreatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.baseMonthlyAmount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    productId: form.productId,
    ...(form.projectId.trim() ? { projectId: form.projectId.trim() } : {}),
    type: form.type,
    baseMonthlyAmount: amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    ...prepaidMonthCountPayload(form.billingFrequency, form.prepaidMonthCount),
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    reminderLanguage: form.reminderLanguage,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : {}),
    ...(form.partnerId.trim() ? { partnerId: form.partnerId.trim() } : {}),
  };
}

export function buildSubscriptionUpdatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.baseMonthlyAmount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    type: form.type,
    ...(form.productId.trim()
      ? {
          productId: form.productId.trim(),
          ...(form.projectId.trim() ? { projectId: form.projectId.trim() } : {}),
        }
      : {}),
    baseMonthlyAmount: amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    ...prepaidMonthCountPayload(form.billingFrequency, form.prepaidMonthCount),
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    reminderLanguage: form.reminderLanguage,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : { endDate: '' }),
    partnerId: form.partnerId.trim() ? form.partnerId.trim() : null,
  };
}
