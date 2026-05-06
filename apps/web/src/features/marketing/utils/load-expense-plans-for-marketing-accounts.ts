import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';
import type { MarketingAccount } from '@/lib/api/marketing';

/** Matches `EXPENSE_LIST_MAX_PAGE_SIZE` on the API — one picker load for Marketing Settings. */
export const MARKETING_EXPENSE_PLAN_LIST_PAGE_SIZE = 500;

/**
 * Loads expense plans for the marketing account ↔ finance plan picker, including any
 * already-linked plan ids not present in the first page (deleted or filtered edge cases).
 */
export async function loadExpensePlansForMarketingAccounts(
  accounts: MarketingAccount[],
): Promise<ExpensePlan[]> {
  const list = await expensePlansApi.getAll({
    page: 1,
    pageSize: MARKETING_EXPENSE_PLAN_LIST_PAGE_SIZE,
    category: 'MARKETING',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const byId = new Map(list.items.map((plan) => [plan.id, plan]));

  const linkedIds = [
    ...new Set(
      accounts
        .map((account) => account.financeExpensePlanId)
        .filter((id): id is string => Boolean(id?.trim())),
    ),
  ];

  const missingIds = linkedIds.filter((id) => !byId.has(id));

  const resolved = await Promise.all(
    missingIds.map(async (id) => {
      try {
        return await expensePlansApi.getById(id);
      } catch {
        return null;
      }
    }),
  );

  for (const plan of resolved) {
    if (plan) {
      byId.set(plan.id, plan);
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
