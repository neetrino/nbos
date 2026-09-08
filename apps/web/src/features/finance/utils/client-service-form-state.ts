import type { ClientServiceRecord, ClientServiceRecordPayload } from '@/lib/api/client-services';
import { DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE } from '@/features/finance/constants/finance';

export interface ClientServiceFormState {
  projectId: string;
  productId: string;
  type: string;
  name: string;
  provider: string;
  providerAccountId: string;
  status: string;
  billingModel: string;
  pricingModel: string;
  frequency: string;
  ourCost: string;
  clientCharge: string;
  taxStatus: string;
  notificationsEnabled: boolean;
  reminderLanguage: string;
  startDate: string;
  renewalDate: string;
  notes: string;
}

export const EMPTY_CLIENT_SERVICE_FORM: ClientServiceFormState = {
  projectId: '',
  productId: '',
  type: 'DOMAIN',
  name: '',
  provider: '',
  providerAccountId: '',
  status: 'PENDING',
  billingModel: 'WE_PAY',
  pricingModel: 'FIXED',
  frequency: 'YEARLY',
  ourCost: '',
  clientCharge: '',
  taxStatus: 'TAX',
  notificationsEnabled: true,
  reminderLanguage: DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
  startDate: '',
  renewalDate: '',
  notes: '',
};

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function clientServiceToFormState(row: ClientServiceRecord): ClientServiceFormState {
  return {
    projectId: row.projectId,
    productId: row.productId ?? '',
    type: row.type,
    name: row.name,
    provider: row.provider ?? '',
    providerAccountId: row.providerAccountId ?? '',
    status: row.status,
    billingModel: row.billingModel,
    pricingModel: row.pricingModel,
    frequency: row.frequency,
    ourCost: row.ourCost ?? '',
    clientCharge: row.clientCharge ?? '',
    taxStatus: row.taxStatus,
    notificationsEnabled: row.notificationsEnabled,
    reminderLanguage: row.reminderLanguage ?? DEFAULT_SUBSCRIPTION_REMINDER_LANGUAGE,
    startDate: toDateInputValue(row.startDate),
    renewalDate: toDateInputValue(row.renewalDate),
    notes: row.notes ?? '',
  };
}

export function clientServiceFormToPayload(
  form: ClientServiceFormState,
): ClientServiceRecordPayload {
  return {
    projectId: form.projectId,
    productId: form.productId.trim() || null,
    type: form.type,
    name: form.name.trim(),
    provider: form.provider.trim() || null,
    providerAccountId: form.providerAccountId.trim() || null,
    status: form.status,
    billingModel: form.billingModel,
    pricingModel: form.pricingModel,
    frequency: form.frequency,
    ourCost: parseOptionalAmount(form.ourCost),
    clientCharge: parseOptionalAmount(form.clientCharge),
    taxStatus: form.taxStatus,
    notificationsEnabled: form.notificationsEnabled,
    reminderLanguage: form.reminderLanguage,
    startDate: form.startDate || null,
    renewalDate: form.renewalDate || null,
    notes: form.notes.trim() || null,
  };
}

export function isClientServiceFormDirty(
  a: ClientServiceFormState,
  b: ClientServiceFormState,
): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/\s/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
