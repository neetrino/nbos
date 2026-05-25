import type { Subscription } from '@/lib/api/finance';

export interface SubscriptionFormState {
  projectId: string;
  type: string;
  baseMonthlyAmount: string;
  billingFrequency: string;
  billingDay: string;
  billingStartDate: string;
  taxStatus: string;
  notificationsEnabled: boolean;
  endDate: string;
  partnerId: string;
}

export const EMPTY_SUBSCRIPTION_FORM: SubscriptionFormState = {
  projectId: '',
  type: 'MAINTENANCE_ONLY',
  baseMonthlyAmount: '',
  billingFrequency: 'MONTHLY',
  billingDay: '1',
  billingStartDate: '',
  taxStatus: 'TAX',
  notificationsEnabled: true,
  endDate: '',
  partnerId: '',
};

export function subscriptionToFormState(subscription: Subscription): SubscriptionFormState {
  return {
    projectId: subscription.projectId,
    type: subscription.type,
    baseMonthlyAmount: subscription.baseMonthlyAmount,
    billingFrequency: subscription.billingFrequency,
    billingDay: String(subscription.billingDay),
    billingStartDate: subscription.billingStartDate.slice(0, 10),
    taxStatus: subscription.taxStatus,
    notificationsEnabled: subscription.notificationsEnabled,
    endDate: subscription.endDate ? subscription.endDate.slice(0, 10) : '',
    partnerId: subscription.partner?.id ?? '',
  };
}

export function buildSubscriptionCreatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.baseMonthlyAmount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    projectId: form.projectId,
    type: form.type,
    baseMonthlyAmount: amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : {}),
    ...(form.partnerId.trim() ? { partnerId: form.partnerId.trim() } : {}),
  };
}

export function buildSubscriptionUpdatePayload(form: SubscriptionFormState) {
  const amount = parseFloat(form.baseMonthlyAmount.replace(/\s/g, ''));
  const billingDay = parseInt(form.billingDay, 10);
  return {
    type: form.type,
    baseMonthlyAmount: amount,
    billingDay,
    billingFrequency: form.billingFrequency,
    taxStatus: form.taxStatus,
    billingStartDate: new Date(form.billingStartDate).toISOString(),
    notificationsEnabled: form.notificationsEnabled,
    ...(form.endDate.trim() ? { endDate: new Date(form.endDate).toISOString() } : { endDate: '' }),
    partnerId: form.partnerId.trim() ? form.partnerId.trim() : null,
  };
}
