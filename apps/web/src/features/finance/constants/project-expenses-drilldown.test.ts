import { describe, expect, it } from 'vitest';
import { EXPENSE_LIST_SORT_BY_QUERY, EXPENSE_LIST_SORT_ORDER_QUERY } from './expenses-list-query';
import {
  EXPENSE_FROM_BACKLOG_QUERY,
  EXPENSE_PLAN_DRILLDOWN_QUERY,
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  EXPENSE_BACKLOG_LIST_PATH,
  expenseDetailHref,
  financeExpensesListHref,
  planExpensesDrilldownHref,
  projectExpensesBacklogDrilldownHref,
  projectExpensesDrilldownHref,
} from './project-expenses-drilldown';

describe('project-expenses-drilldown', () => {
  it('projectExpensesDrilldownHref sets query key', () => {
    expect(projectExpensesDrilldownHref('abc')).toBe(
      `/finance/expenses?${PROJECT_EXPENSES_DRILLDOWN_QUERY}=abc`,
    );
  });

  it('planExpensesDrilldownHref sets expensePlanId query key', () => {
    expect(planExpensesDrilldownHref('plan-z')).toBe(
      `/finance/expenses?${EXPENSE_PLAN_DRILLDOWN_QUERY}=plan-z`,
    );
  });

  it('projectExpensesBacklogDrilldownHref targets backlog path', () => {
    expect(projectExpensesBacklogDrilldownHref('abc')).toBe(
      `${EXPENSE_BACKLOG_LIST_PATH}?${PROJECT_EXPENSES_DRILLDOWN_QUERY}=abc`,
    );
  });

  it('financeExpensesListHref falls back to bare path', () => {
    expect(financeExpensesListHref()).toBe('/finance/expenses');
    expect(financeExpensesListHref(null)).toBe('/finance/expenses');
  });

  it('financeExpensesListHref adds sort when non-default', () => {
    const href = financeExpensesListHref(null, { sortBy: 'amount', sortOrder: 'asc' });
    expect(href).toContain(`${EXPENSE_LIST_SORT_BY_QUERY}=amount`);
    expect(href).toContain(`${EXPENSE_LIST_SORT_ORDER_QUERY}=asc`);
  });

  it('financeExpensesListHref targets backlog path when option set', () => {
    expect(financeExpensesListHref(null, undefined, { fromBacklog: true })).toBe(
      EXPENSE_BACKLOG_LIST_PATH,
    );
  });

  it('expenseDetailHref adds project query when provided', () => {
    expect(expenseDetailHref('ex-1', 'proj-x')).toContain('ex-1');
    expect(expenseDetailHref('ex-1', 'proj-x')).toContain(
      `${PROJECT_EXPENSES_DRILLDOWN_QUERY}=proj-x`,
    );
    expect(expenseDetailHref('ex-1', null)).toBe('/finance/expenses/ex-1');
  });

  it('expenseDetailHref adds sort when provided', () => {
    const href = expenseDetailHref('ex-1', null, { sortBy: 'name', sortOrder: 'asc' });
    expect(href).toContain('/finance/expenses/ex-1?');
    expect(href).toContain(`${EXPENSE_LIST_SORT_BY_QUERY}=name`);
    expect(href).toContain(`${EXPENSE_LIST_SORT_ORDER_QUERY}=asc`);
  });

  it('expenseDetailHref adds from=backlog when option set', () => {
    expect(expenseDetailHref('ex-1', null, undefined, { fromBacklog: true })).toBe(
      `/finance/expenses/ex-1?${EXPENSE_FROM_BACKLOG_QUERY}=backlog`,
    );
  });

  it('financeExpensesListHref adds expensePlanId when option set', () => {
    const href = financeExpensesListHref(null, undefined, { expensePlanId: 'plan-1' });
    expect(href).toContain(`${EXPENSE_PLAN_DRILLDOWN_QUERY}=plan-1`);
  });

  it('expenseDetailHref adds expensePlanId when option set', () => {
    const href = expenseDetailHref('ex-1', null, undefined, { expensePlanId: 'plan-2' });
    expect(href).toContain(`${EXPENSE_PLAN_DRILLDOWN_QUERY}=plan-2`);
  });
});
