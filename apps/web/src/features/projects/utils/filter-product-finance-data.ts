import { ORDER_BOARD_STAGES } from '@/features/finance/constants/order-board-lifecycle';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import {
  CLIENT_SERVICE_FILTER_BILLING_KEY,
  CLIENT_SERVICE_FILTER_STATUS_KEY,
  CLIENT_SERVICE_FILTER_TYPE_KEY,
} from '@/features/finance/components/client-services/build-client-service-integrated-filter-configs';
import { matchesBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { INVOICE_MONEY_BOARD_STAGES } from '@/features/finance/constants/invoice-board-lifecycle';
import type { Invoice, Order } from '@/lib/api/finance';
import type { ProjectSubscription } from '@/lib/api/projects';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import {
  PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
  PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
  resolveProductFinanceBoardScope,
} from '@/features/projects/utils/resolve-product-finance-scope';

function rowMatchesOptionalFilter(filterValue: string | undefined, rowValue: string): boolean {
  return !filterValue || filterValue === 'all' || rowValue === filterValue;
}

export function filterProductFinanceOrders(
  orders: Order[],
  search: string,
  filters: Record<string, string>,
): Order[] {
  const needle = search.trim().toLowerCase();
  const boardScope = resolveProductFinanceBoardScope(filters.boardScope);
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

export function filterProductFinanceInvoices(
  invoices: Invoice[],
  search: string,
  filters: Record<string, string>,
): Invoice[] {
  const needle = search.trim().toLowerCase();
  const boardScope = resolveProductFinanceBoardScope(filters.boardScope);
  const hasStatusFilter = Boolean(filters.moneyStatus) && filters.moneyStatus !== 'all';

  let rows = invoices;
  if (needle) {
    rows = rows.filter((invoice) => {
      const haystack = `${invoice.code} ${invoice.company?.name ?? ''} ${invoice.product?.name ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }
  if (hasStatusFilter) {
    return rows.filter((invoice) => invoice.moneyStatus === filters.moneyStatus);
  }
  return rows.filter((invoice) =>
    matchesBoardLifecycleScope(invoice.moneyStatus, INVOICE_MONEY_BOARD_STAGES, boardScope),
  );
}

export function scopeProductFinanceSubscriptions(
  subscriptions: ProjectSubscription[],
  productId: string,
): ProjectSubscription[] {
  return subscriptions.filter((subscription) => subscription.productId === productId);
}

export function filterProductFinanceSubscriptions(
  subscriptions: ProjectSubscription[],
  search: string,
  filters: Record<string, string>,
): ProjectSubscription[] {
  const needle = search.trim().toLowerCase();
  return subscriptions.filter((sub) => {
    if (needle) {
      const haystack = `${sub.name} ${sub.code} ${sub.type}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (!rowMatchesOptionalFilter(filters.type, sub.type)) return false;
    if (!rowMatchesOptionalFilter(filters.status, sub.status)) return false;
    return true;
  });
}

export function productFinanceFilterValuesForUi(
  section: ProductFinanceSection,
  filters: Record<string, string>,
): Record<string, string> {
  if (section === 'orders' || section === 'invoices') {
    return {
      boardScope: filters.boardScope ?? PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
      ...filters,
    };
  }
  if (section === 'expenses') {
    return {
      [EXPENSE_BOARD_SCOPE_FILTER_KEY]:
        filters[EXPENSE_BOARD_SCOPE_FILTER_KEY] ?? PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
      ...filters,
    };
  }
  if (section === 'subscriptions') {
    return {
      type: filters.type ?? 'all',
      status: filters.status ?? 'all',
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
