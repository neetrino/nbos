import type { FilterConfig } from '@/components/shared/FilterBar';
import {
  CLIENT_SERVICE_BILLING_MODELS,
  CLIENT_SERVICE_STATUSES,
  CLIENT_SERVICE_TYPES,
} from '@/features/finance/constants/client-services';

export const CLIENT_SERVICE_FILTER_TYPE_KEY = 'type' as const;
export const CLIENT_SERVICE_FILTER_STATUS_KEY = 'status' as const;
export const CLIENT_SERVICE_FILTER_BILLING_KEY = 'billing' as const;

export function buildClientServiceIntegratedFilterConfigs(): FilterConfig[] {
  return [
    {
      key: CLIENT_SERVICE_FILTER_TYPE_KEY,
      label: 'Type',
      options: CLIENT_SERVICE_TYPES.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
    {
      key: CLIENT_SERVICE_FILTER_STATUS_KEY,
      label: 'Status',
      options: CLIENT_SERVICE_STATUSES.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
    {
      key: CLIENT_SERVICE_FILTER_BILLING_KEY,
      label: 'Billing',
      options: CLIENT_SERVICE_BILLING_MODELS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    },
  ];
}
