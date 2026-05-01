import { expensePlansApi } from '@/lib/api/expense-plans';
import type { ExpensePlan, ExpensePlanListParams } from '@/lib/api/expense-plans';

const EXPENSE_PLAN_EXPORT_PAGE_CHUNK_SIZE = 500;

const EXPENSE_PLAN_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every expense plan row by paging through `GET /api/expense-plans`.
 */
export async function fetchAllExpensePlansForExport(
  params: Omit<ExpensePlanListParams, 'page' | 'pageSize'>,
): Promise<ExpensePlan[]> {
  const aggregated: ExpensePlan[] = [];
  let page = 1;
  while (aggregated.length < EXPENSE_PLAN_EXPORT_ROW_HARD_CAP) {
    const data = await expensePlansApi.getAll({
      ...params,
      page,
      pageSize: EXPENSE_PLAN_EXPORT_PAGE_CHUNK_SIZE,
    });
    aggregated.push(...data.items);
    const totalPages = Math.max(1, data.meta.totalPages);
    if (page >= totalPages || data.items.length === 0) {
      break;
    }
    page += 1;
  }
  return aggregated;
}
