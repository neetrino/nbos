import type { FilterConfig } from '@/components/shared/FilterBar';
import type { StatusVariant } from '@/components/shared';

export const EXPENSE_PLAN_STATUSES = [
  { value: 'ACTIVE', label: 'Active', variant: 'green' as StatusVariant },
  { value: 'CANCELLED', label: 'Cancelled', variant: 'red' as StatusVariant },
] as const;

export const EXPENSE_PLAN_STATUS_FILTER_KEY = 'status' as const;
export const EXPENSE_PLAN_STATUS_FILTER_ACTIVE = 'ACTIVE' as const;
export const EXPENSE_PLAN_STATUS_FILTER_ALL = 'all' as const;

export function getExpensePlanStatus(value: string | undefined) {
  if (!value) return undefined;
  return EXPENSE_PLAN_STATUSES.find((status) => status.value === value);
}

export function buildExpensePlanStatusFilterConfig(): FilterConfig {
  return {
    key: EXPENSE_PLAN_STATUS_FILTER_KEY,
    label: 'Status',
    includeAllOption: false,
    defaultOptionValue: EXPENSE_PLAN_STATUS_FILTER_ACTIVE,
    options: [
      { value: EXPENSE_PLAN_STATUS_FILTER_ACTIVE, label: 'Active' },
      { value: 'CANCELLED', label: 'Cancelled' },
      { value: EXPENSE_PLAN_STATUS_FILTER_ALL, label: 'All statuses' },
    ],
  };
}

/** Maps the Status filter to the list/grid `status` query (omit = every status). */
export function resolveExpensePlanStatusApiParam(
  statusFilter: string | undefined,
): string | undefined {
  if (!statusFilter || statusFilter === EXPENSE_PLAN_STATUS_FILTER_ACTIVE) {
    return EXPENSE_PLAN_STATUS_FILTER_ACTIVE;
  }
  if (statusFilter === EXPENSE_PLAN_STATUS_FILTER_ALL) {
    return undefined;
  }
  return statusFilter;
}
