'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LoadingState } from '@/components/shared';
import {
  EXPENSE_LIST_SORT_BY_QUERY,
  EXPENSE_LIST_SORT_ORDER_QUERY,
  parseExpenseListSortByParam,
  parseExpenseListSortOrderParam,
  setExpenseListSortParams,
} from '@/features/finance/constants/expenses-list-query';
import { PROJECT_EXPENSES_DRILLDOWN_QUERY } from '@/features/finance/constants/project-expenses-drilldown';
import type { ExpenseListSortField } from '@/lib/api/finance';
import { ExpensesPageContent } from '@/features/finance/components/expenses/ExpensesPageContent';

function ExpensesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get(PROJECT_EXPENSES_DRILLDOWN_QUERY);

  const replaceExpensesUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : (pathname ?? '/finance/expenses'));
    },
    [pathname, router, searchParams],
  );

  const sortBy = parseExpenseListSortByParam(searchParams.get(EXPENSE_LIST_SORT_BY_QUERY));
  const sortOrder = parseExpenseListSortOrderParam(searchParams.get(EXPENSE_LIST_SORT_ORDER_QUERY));

  const clearProjectFilter = useCallback(() => {
    replaceExpensesUrl((params) => {
      params.delete(PROJECT_EXPENSES_DRILLDOWN_QUERY);
    });
  }, [replaceExpensesUrl]);

  const onSortByChange = useCallback(
    (value: ExpenseListSortField) => {
      replaceExpensesUrl((params) => {
        const order = parseExpenseListSortOrderParam(params.get(EXPENSE_LIST_SORT_ORDER_QUERY));
        setExpenseListSortParams(params, value, order);
      });
    },
    [replaceExpensesUrl],
  );

  const onSortOrderChange = useCallback(
    (value: 'asc' | 'desc') => {
      replaceExpensesUrl((params) => {
        const field = parseExpenseListSortByParam(params.get(EXPENSE_LIST_SORT_BY_QUERY));
        setExpenseListSortParams(params, field, value);
      });
    },
    [replaceExpensesUrl],
  );

  return (
    <ExpensesPageContent
      projectIdFromUrl={projectIdFromUrl}
      onClearProjectFilter={clearProjectFilter}
      replaceExpensesUrl={replaceExpensesUrl}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortByChange={onSortByChange}
      onSortOrderChange={onSortOrderChange}
    />
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full flex-col gap-5">
          <LoadingState />
        </div>
      }
    >
      <ExpensesPageInner />
    </Suspense>
  );
}
