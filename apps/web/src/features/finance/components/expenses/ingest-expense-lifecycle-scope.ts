import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import { EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY } from './expense-lifecycle-scope';

export function isExpenseLifecycleScopeQuery(value: string | null): value is string {
  return value === 'ALL' || value === 'ACTIVE' || value === 'CLOSED';
}

export function peekExpenseLifecycleScopeQuery(value: string | null): string | null {
  return isExpenseLifecycleScopeQuery(value) ? value : null;
}

export function applyExpenseLifecycleScopeFilter(
  prev: Record<string, string>,
  value: string,
): Record<string, string> {
  if (value === DEFAULT_BOARD_LIFECYCLE_SCOPE) {
    const next = { ...prev };
    delete next[EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY];
    return next;
  }
  return { ...prev, [EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY]: value };
}

export function stripLegacyExpenseStatusFilter(
  filters: Record<string, string>,
): Record<string, string> {
  if (!Object.prototype.hasOwnProperty.call(filters, 'status')) {
    return filters;
  }
  const next = { ...filters };
  delete next.status;
  return next;
}

export function mergePayNowFiltersForList(input: {
  filters: Record<string, string>;
  urlLifecycleScope: string | null;
  stripStatus: boolean;
}): Record<string, string> {
  const base =
    input.stripStatus === true ? stripLegacyExpenseStatusFilter(input.filters) : input.filters;
  if (!input.urlLifecycleScope) {
    return base;
  }
  return applyExpenseLifecycleScopeFilter(base, input.urlLifecycleScope);
}
