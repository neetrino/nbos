import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import type { BoardLifecycleScope } from '@/features/shared/board-lifecycle';

/** Product Finance tab shows full history until the user narrows scope. */
export const PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE: BoardLifecycleScope = 'ALL';

export const PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE = 'all' as const;

export type ProductFinanceExpenseScope = 'all' | 'active' | 'backlog' | 'closed';

export function resolveProductFinanceBoardScope(value: string | undefined): BoardLifecycleScope {
  if (value === 'ACTIVE') return 'ACTIVE';
  if (value === 'CLOSED') return 'CLOSED';
  return PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE;
}

export function resolveProductFinanceExpenseScope(
  value: string | undefined,
): ProductFinanceExpenseScope {
  if (value === 'active' || value === 'backlog' || value === 'closed') {
    return value;
  }
  return PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE;
}

export function productFinanceExpenseListPageVariant(
  scope: ProductFinanceExpenseScope,
): 'default' | 'backlog' | 'closed' | 'all' {
  if (scope === 'active') return 'default';
  return scope;
}

export function productFinanceExpenseAllowsKanban(filters: Record<string, string>): boolean {
  const scope = resolveProductFinanceExpenseScope(filters[EXPENSE_BOARD_SCOPE_FILTER_KEY]);
  return scope === 'active' || scope === 'closed';
}
