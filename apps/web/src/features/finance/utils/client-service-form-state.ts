import type { ClientServiceRecord } from '@/lib/api/client-services';

export interface ClientServiceFormState {
  projectId: string;
  type: string;
  name: string;
  provider: string;
  status: string;
  billingModel: string;
  pricingModel: string;
  frequency: string;
  ourCost: string;
  clientCharge: string;
  taxStatus: string;
  notificationsEnabled: boolean;
  startDate: string;
  renewalDate: string;
  notes: string;
}

export const EMPTY_CLIENT_SERVICE_FORM: ClientServiceFormState = {
  projectId: '',
  type: 'DOMAIN',
  name: '',
  provider: '',
  status: 'PENDING',
  billingModel: 'CLIENT_PAID',
  pricingModel: 'FIXED',
  frequency: 'YEARLY',
  ourCost: '',
  clientCharge: '',
  taxStatus: 'TAX',
  notificationsEnabled: true,
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
    type: row.type,
    name: row.name,
    provider: row.provider ?? '',
    status: row.status,
    billingModel: row.billingModel,
    pricingModel: row.pricingModel,
    frequency: row.frequency,
    ourCost: row.ourCost ?? '',
    clientCharge: row.clientCharge ?? '',
    taxStatus: row.taxStatus,
    notificationsEnabled: row.notificationsEnabled,
    startDate: toDateInputValue(row.startDate),
    renewalDate: toDateInputValue(row.renewalDate),
    notes: row.notes ?? '',
  };
}

export function parseOptionalAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/\s/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
