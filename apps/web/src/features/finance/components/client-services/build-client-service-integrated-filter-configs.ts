import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';

export const CLIENT_SERVICE_FILTER_TYPE_KEY = 'type' as const;
export const CLIENT_SERVICE_FILTER_STATUS_KEY = 'status' as const;
export const CLIENT_SERVICE_FILTER_BILLING_KEY = 'billing' as const;

export interface ClientServiceFilterLabels {
  type: string;
  status: string;
  billing: string;
  typeLabel: (value: string, fallback: string) => string;
  statusLabel: (value: string, fallback: string) => string;
  billingLabel: (value: string, fallback: string) => string;
}

export function buildClientServiceIntegratedFilterConfigs(
  labels?: ClientServiceFilterLabels,
): FilterConfig[] {
  return [
    {
      key: CLIENT_SERVICE_FILTER_TYPE_KEY,
      label: labels?.type ?? 'Type',
      options: CLIENT_SERVICE_TYPES.map((option) => ({
        value: option.value,
        label: labels?.typeLabel(option.value, option.label) ?? option.label,
      })),
    },
    {
      key: CLIENT_SERVICE_FILTER_STATUS_KEY,
      label: labels?.status ?? 'Status',
      options: CLIENT_SERVICE_STATUSES.map((option) => ({
        value: option.value,
        label: labels?.statusLabel(option.value, option.label) ?? option.label,
      })),
    },
    {
      key: CLIENT_SERVICE_FILTER_BILLING_KEY,
      label: labels?.billing ?? 'Billing',
      options: CLIENT_SERVICE_BILLING_MODELS.map((option) => ({
        value: option.value,
        label: labels?.billingLabel(option.value, option.label) ?? option.label,
      })),
    },
  ];
}
