import type { ExpenseCategoryEnum, ExpenseFrequency, Prisma } from '@nbos/database';
import type { FinanceScopedAccessContext } from '../finance/finance-scoped-access';
import { coerceExpenseCategoryToCanonical } from './expense-category-canonical';
import { parseExpensePlanStatusQuery } from './expense-plan-status';
import { pickExpenseCategoryFilter, pickExpenseFrequencyFilter } from './expense-query-enum-guards';

const EXPENSE_PLAN_SORT_FIELDS = new Set(['createdAt', 'nextDueDate', 'amount', 'name']);

export interface ExpensePlanQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  category?: string;
  status?: string;
  frequency?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  access?: FinanceScopedAccessContext;
}

export function buildExpensePlanListWhere(
  params: ExpensePlanQueryParams,
): Prisma.ExpensePlanWhereInput {
  const rawCategory = pickExpenseCategoryFilter(params.category);
  const safeCategory = rawCategory
    ? (coerceExpenseCategoryToCanonical(rawCategory) ?? rawCategory)
    : undefined;
  const searchTrimmed = params.search?.trim();
  const ic = searchTrimmed ? { contains: searchTrimmed, mode: 'insensitive' as const } : undefined;
  const searchOr: Prisma.ExpensePlanWhereInput['OR'] = ic
    ? [
        { name: ic },
        { notes: ic },
        { project: { name: ic } },
        { project: { code: ic } },
        { product: { name: ic } },
      ]
    : undefined;

  const statusWhere = parseExpensePlanStatusQuery(params.status);
  const safeFrequency = pickExpenseFrequencyFilter(params.frequency);
  return {
    ...(safeCategory ? { category: safeCategory as ExpenseCategoryEnum } : {}),
    ...(safeFrequency ? { frequency: safeFrequency as ExpenseFrequency } : {}),
    ...(params.projectId?.trim() ? { projectId: params.projectId.trim() } : {}),
    ...(params.productId?.trim() ? { productId: params.productId.trim() } : {}),
    ...(statusWhere ? { status: statusWhere } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };
}

export function buildExpensePlanOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Prisma.ExpensePlanOrderByWithRelationInput {
  const dir = sortOrder === 'asc' ? ('asc' as const) : ('desc' as const);
  const field = sortBy && EXPENSE_PLAN_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
  return { [field]: dir } as Prisma.ExpensePlanOrderByWithRelationInput;
}
