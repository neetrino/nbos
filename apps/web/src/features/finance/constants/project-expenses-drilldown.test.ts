import { describe, expect, it } from 'vitest';
import {
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  expenseDetailHref,
  financeExpensesListHref,
  projectExpensesDrilldownHref,
} from './project-expenses-drilldown';

describe('project-expenses-drilldown', () => {
  it('projectExpensesDrilldownHref sets query key', () => {
    expect(projectExpensesDrilldownHref('abc')).toBe(
      `/finance/expenses?${PROJECT_EXPENSES_DRILLDOWN_QUERY}=abc`,
    );
  });

  it('financeExpensesListHref falls back to bare path', () => {
    expect(financeExpensesListHref()).toBe('/finance/expenses');
    expect(financeExpensesListHref(null)).toBe('/finance/expenses');
  });

  it('expenseDetailHref adds project query when provided', () => {
    expect(expenseDetailHref('ex-1', 'proj-x')).toContain('ex-1');
    expect(expenseDetailHref('ex-1', 'proj-x')).toContain(
      `${PROJECT_EXPENSES_DRILLDOWN_QUERY}=proj-x`,
    );
    expect(expenseDetailHref('ex-1', null)).toBe('/finance/expenses/ex-1');
  });
});
