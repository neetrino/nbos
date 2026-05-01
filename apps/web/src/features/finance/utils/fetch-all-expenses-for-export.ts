import { expensesApi } from '@/lib/api/finance';
import type { Expense, ExpenseListParams } from '@/lib/api/finance';

/**
 * Chunk size for export requests. Must stay ≤ `EXPENSE_LIST_MAX_PAGE_SIZE`
 * in `apps/api/src/modules/expenses/expenses-list-pagination.ts`.
 */
const EXPENSE_EXPORT_PAGE_CHUNK_SIZE = 500;

/** Safety valve if many pages ever match (misconfiguration / abuse guard). */
const EXPENSE_EXPORT_ROW_HARD_CAP = 50_000;

/**
 * Loads every expense row matching the given list filters by paging through `GET /expenses`.
 */
export async function fetchAllExpensesForExport(
  params: Omit<ExpenseListParams, 'page' | 'pageSize'>,
): Promise<Expense[]> {
  const aggregated: Expense[] = [];
  let page = 1;
  while (aggregated.length < EXPENSE_EXPORT_ROW_HARD_CAP) {
    const data = await expensesApi.getAll({
      ...params,
      page,
      pageSize: EXPENSE_EXPORT_PAGE_CHUNK_SIZE,
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
