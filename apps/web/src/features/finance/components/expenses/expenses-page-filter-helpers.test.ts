import { describe, expect, it } from 'vitest';
import { EXPENSE_BACKLOG_FIXED_STATUS } from '../../constants/project-expenses-drilldown';
import {
  clearedExpenseFilterRecord,
  expenseFiltersWithoutProjectDrilldown,
  initialExpenseFilterRecord,
} from './expenses-page-filter-helpers';

describe('expenses-page-filter-helpers', () => {
  it('initialExpenseFilterRecord backlog locks Delayed', () => {
    expect(initialExpenseFilterRecord('default')).toEqual({});
    expect(initialExpenseFilterRecord('backlog')).toEqual({
      status: EXPENSE_BACKLOG_FIXED_STATUS,
    });
  });

  it('clearedExpenseFilterRecord backlog restores Delayed and optional project', () => {
    expect(clearedExpenseFilterRecord('default', null)).toEqual({});
    expect(clearedExpenseFilterRecord('backlog', null)).toEqual({
      status: EXPENSE_BACKLOG_FIXED_STATUS,
    });
    expect(clearedExpenseFilterRecord('backlog', 'p1')).toEqual({
      status: EXPENSE_BACKLOG_FIXED_STATUS,
      project: 'p1',
    });
  });

  it('expenseFiltersWithoutProjectDrilldown clears project and preserves backlog status', () => {
    expect(
      expenseFiltersWithoutProjectDrilldown(
        { status: EXPENSE_BACKLOG_FIXED_STATUS, project: 'x', category: 'DOMAIN' },
        'backlog',
      ),
    ).toEqual({ status: EXPENSE_BACKLOG_FIXED_STATUS, category: 'DOMAIN' });
    expect(expenseFiltersWithoutProjectDrilldown({ project: 'x' }, 'default')).toEqual({});
  });
});
