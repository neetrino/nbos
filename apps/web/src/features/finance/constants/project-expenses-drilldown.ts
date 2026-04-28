/** Must match `GET /expenses?projectId=` (ExpensesController). */
export const PROJECT_EXPENSES_DRILLDOWN_QUERY = 'projectId' as const;

export function projectExpensesDrilldownHref(projectId: string): string {
  const q = new URLSearchParams({
    [PROJECT_EXPENSES_DRILLDOWN_QUERY]: projectId,
  });
  return `/finance/expenses?${q.toString()}`;
}

export function financeExpensesListHref(projectId?: string | null): string {
  if (!projectId) return '/finance/expenses';
  return projectExpensesDrilldownHref(projectId);
}

/** Preserve project drill-down when opening expense detail from a filtered list. */
export function expenseDetailHref(expenseId: string, listProjectId?: string | null): string {
  if (!listProjectId) return `/finance/expenses/${expenseId}`;
  const q = new URLSearchParams({
    [PROJECT_EXPENSES_DRILLDOWN_QUERY]: listProjectId,
  });
  return `/finance/expenses/${expenseId}?${q.toString()}`;
}
