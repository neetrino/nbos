import { OPEN_EXPENSE_QUERY } from './expense-deep-link';

/** Open expense plan detail sheet on `/finance/expenses/plans` with this query. */
export const OPEN_EXPENSE_PLAN_QUERY = 'openPlan' as const;

const EXPENSE_PLANS_LIST_PATH = '/finance/expenses/plans' as const;

export function expensePlansListWithOpenPlanHref(planId: string): string {
  return `${EXPENSE_PLANS_LIST_PATH}?${OPEN_EXPENSE_PLAN_QUERY}=${encodeURIComponent(planId)}`;
}

/** Open expense card sheet on the plans route (stacked above an optional open plan). */
export function expensePlansListWithOpenExpenseHref(
  expenseId: string,
  planId?: string | null,
): string {
  const params = new URLSearchParams();
  const plan = planId?.trim();
  if (plan) {
    params.set(OPEN_EXPENSE_PLAN_QUERY, plan);
  }
  params.set(OPEN_EXPENSE_QUERY, expenseId);
  return `${EXPENSE_PLANS_LIST_PATH}?${params.toString()}`;
}
