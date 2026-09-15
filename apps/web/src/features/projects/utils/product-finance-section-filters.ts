import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import type { ProductFinanceSection } from '@/features/projects/constants/product-finance-section';
import {
  PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
  PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
} from '@/features/projects/utils/resolve-product-finance-scope';

export function defaultProductFinanceFiltersForSection(
  _section: ProductFinanceSection,
): Record<string, string> {
  return {};
}

export function nextProductFinanceSectionFilters(
  current: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  if (key === 'boardScope' && value === PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE) {
    const next = { ...current };
    delete next.boardScope;
    return next;
  }
  if (key === EXPENSE_BOARD_SCOPE_FILTER_KEY && value === PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE) {
    const next = { ...current };
    delete next[EXPENSE_BOARD_SCOPE_FILTER_KEY];
    return next;
  }
  return { ...current, [key]: value };
}
