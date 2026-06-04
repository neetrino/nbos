import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type { Order } from '@/lib/api/finance';
import type { ProjectDomain, ProjectExpense, ProjectSubscription } from '@/lib/api/projects';

function matchesNeedle(value: string | null | undefined, needle: string): boolean {
  return (value ?? '').toLowerCase().includes(needle);
}

function matchesFilterValue(filterValue: string | undefined, rowValue: string): boolean {
  return Boolean(filterValue) && filterValue !== 'all' && rowValue === filterValue;
}

export function filterProductFinanceOrders(
  orders: Order[],
  search: string,
  filters: Record<string, string>,
): Order[] {
  const needle = search.trim().toLowerCase();
  const boardScope = resolveBoardLifecycleScope(filters.boardScope) as BoardLifecycleScope;
  const hasStatusFilter = Boolean(filters.status) && filters.status !== 'all';

  let rows = orders;
  if (needle) {
    rows = rows.filter(
      (order) =>
        order.code.toLowerCase().includes(needle) ||
        order.project.name.toLowerCase().includes(needle) ||
        order.type.toLowerCase().includes(needle),
    );
  }
  if (hasStatusFilter) {
    return rows.filter((order) => order.status === filters.status);
  }
  return rows.filter((order) =>
    matchesBoardLifecycleScope(order.status, ORDER_BOARD_STAGES, boardScope),
  );
}

export function filterProductFinanceSubscriptions(
  subscriptions: ProjectSubscription[],
  search: string,
  filters: Record<string, string>,
): ProjectSubscription[] {
  const needle = search.trim().toLowerCase();
  return subscriptions.filter((sub) => {
    if (needle) {
      const haystack = `${sub.code} ${sub.type}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (matchesFilterValue(filters.type, sub.type)) return false;
    if (matchesFilterValue(filters.status, sub.status)) return false;
    return true;
  });
}

export function filterProductFinanceExpenses(
  expenses: ProjectExpense[],
  search: string,
  filters: Record<string, string>,
): ProjectExpense[] {
  const needle = search.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (needle) {
      const haystack = `${expense.name} ${expense.category} ${expense.type}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (matchesFilterValue(filters.category, expense.category)) return false;
    if (matchesFilterValue(filters.status, expense.status)) return false;
    return true;
  });
}

export function filterProductFinanceDomains(
  domains: ProjectDomain[],
  search: string,
  filters: Record<string, string>,
): ProjectDomain[] {
  const needle = search.trim().toLowerCase();
  return domains.filter((domain) => {
    if (needle) {
      if (!matchesNeedle(domain.domainName, needle) && !matchesNeedle(domain.provider, needle)) {
        return false;
      }
    }
    if (matchesFilterValue(filters.status, domain.status)) return false;
    return true;
  });
}

export function productFinanceFilterValuesForUi(
  section: 'orders',
  filters: Record<string, string>,
): Record<string, string>;
export function productFinanceFilterValuesForUi(
  section: string,
  filters: Record<string, string>,
): Record<string, string> {
  if (section === 'orders') {
    return {
      boardScope: filters.boardScope ?? DEFAULT_BOARD_LIFECYCLE_SCOPE,
      ...filters,
    };
  }
  return filters;
}
