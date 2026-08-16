import type { FilterConfig } from '@/components/shared/FilterBar';
import { SUBSCRIPTION_STATUSES } from '@/features/finance/constants/finance';

export const SUBSCRIPTION_STATUS_FILTER_KEY = 'status' as const;
export const SUBSCRIPTION_STATUS_FILTER_WORKING = 'working' as const;
export const SUBSCRIPTION_STATUS_FILTER_ALL = 'all' as const;
export const SUBSCRIPTION_WORKING_STATUS_API = 'PENDING,ACTIVE' as const;

export function buildSubscriptionStatusFilterConfig(): FilterConfig {
  return {
    key: SUBSCRIPTION_STATUS_FILTER_KEY,
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: SUBSCRIPTION_STATUS_FILTER_WORKING,
    options: [
      { value: SUBSCRIPTION_STATUS_FILTER_WORKING, label: 'Pending + Active' },
      ...SUBSCRIPTION_STATUSES.map((status) => ({
        value: status.value,
        label: status.label,
      })),
      { value: SUBSCRIPTION_STATUS_FILTER_ALL, label: 'All statuses' },
    ],
  };
}

/** Maps the Status filter to the list/grid `status` query (omit = every status). */
export function resolveSubscriptionStatusApiParam(
  statusFilter: string | undefined,
): string | undefined {
  if (!statusFilter || statusFilter === SUBSCRIPTION_STATUS_FILTER_WORKING) {
    return SUBSCRIPTION_WORKING_STATUS_API;
  }
  if (statusFilter === SUBSCRIPTION_STATUS_FILTER_ALL) {
    return undefined;
  }
  return statusFilter;
}
