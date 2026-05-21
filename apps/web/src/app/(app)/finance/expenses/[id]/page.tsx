import { redirect } from 'next/navigation';
import {
  EXPENSE_LIST_SORT_BY_QUERY,
  EXPENSE_LIST_SORT_ORDER_QUERY,
  parseExpenseListSortByParam,
  parseExpenseListSortOrderParam,
} from '@/features/finance/constants/expenses-list-query';
import {
  EXPENSE_FROM_BACKLOG_QUERY,
  EXPENSE_FROM_BACKLOG_VALUE,
  EXPENSE_PLAN_DRILLDOWN_QUERY,
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  expenseDetailHref,
} from '@/features/finance/constants/project-expenses-drilldown';

/** Legacy full-page URLs open the expense detail sheet on the list route. */
export default async function ExpenseDetailRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const listProjectId =
    typeof query[PROJECT_EXPENSES_DRILLDOWN_QUERY] === 'string'
      ? query[PROJECT_EXPENSES_DRILLDOWN_QUERY]
      : null;
  const expensePlanId =
    typeof query[EXPENSE_PLAN_DRILLDOWN_QUERY] === 'string'
      ? query[EXPENSE_PLAN_DRILLDOWN_QUERY]
      : undefined;
  const fromBacklog = query[EXPENSE_FROM_BACKLOG_QUERY] === EXPENSE_FROM_BACKLOG_VALUE;
  const sortBy = parseExpenseListSortByParam(
    typeof query[EXPENSE_LIST_SORT_BY_QUERY] === 'string'
      ? query[EXPENSE_LIST_SORT_BY_QUERY]
      : null,
  );
  const sortOrder = parseExpenseListSortOrderParam(
    typeof query[EXPENSE_LIST_SORT_ORDER_QUERY] === 'string'
      ? query[EXPENSE_LIST_SORT_ORDER_QUERY]
      : null,
  );

  redirect(
    expenseDetailHref(id, listProjectId, { sortBy, sortOrder }, { fromBacklog, expensePlanId }),
  );
}
