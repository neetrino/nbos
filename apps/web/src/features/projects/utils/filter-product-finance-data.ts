import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import {
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from '@/features/finance/components/client-services/build-client-service-integrated-filter-configs';
import {
  DEFAULT_BOARD_LIFECYCLE_SCOPE,
  matchesBoardLifecycleScope,
  resolveBoardLifecycleScope,
  type BoardLifecycleScope,
} from '@/features/shared/board-lifecycle';
import type { Order } from '@/lib/api/finance';
import type { ProjectSubscription } from '@/lib/api/projects';

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
  if (section === 'expenses') {
    return {
      [EXPENSE_BOARD_SCOPE_FILTER_KEY]: filters[EXPENSE_BOARD_SCOPE_FILTER_KEY] ?? 'active',
      ...filters,
    };
  }
  if (section === 'client-services') {
    return {
      [CLIENT_SERVICE_FILTER_TYPE_KEY]: filters[CLIENT_SERVICE_FILTER_TYPE_KEY] ?? 'all',
      [CLIENT_SERVICE_FILTER_STATUS_KEY]: filters[CLIENT_SERVICE_FILTER_STATUS_KEY] ?? 'all',
      [CLIENT_SERVICE_FILTER_BILLING_KEY]: filters[CLIENT_SERVICE_FILTER_BILLING_KEY] ?? 'all',
      ...filters,
    };
  }
  return filters;
}
