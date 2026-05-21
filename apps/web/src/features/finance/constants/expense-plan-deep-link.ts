/** Open expense plan detail sheet on `/finance/expenses/plans` with this query. */
export const OPEN_EXPENSE_PLAN_QUERY = 'openPlan' as const;

const EXPENSE_PLANS_LIST_PATH = '/finance/expenses/plans' as const;

export function expensePlansListWithOpenPlanHref(planId: string): string {
  return `${EXPENSE_PLANS_LIST_PATH}?${OPEN_EXPENSE_PLAN_QUERY}=${encodeURIComponent(planId)}`;
}
