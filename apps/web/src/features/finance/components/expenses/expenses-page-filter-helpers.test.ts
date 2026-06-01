import { describe, expect, it } from 'vitest';
import {
  clearedExpenseFilterRecord,
  initialExpenseFilterRecord,
} from './expenses-page-filter-helpers';

describe('expenses-page-filter-helpers', () => {
  it('initial Pay Now scope shows all expenses (no payroll preset)', () => {
    const filters = initialExpenseFilterRecord('default');
    expect(filters.payrollSource).toBe('all');
    expect(filters.payrollMonth).toBe('all');
    expect(filters.payrollEmployee).toBe('all');
  });

  it('cleared default scope matches initial (all expenses)', () => {
    expect(clearedExpenseFilterRecord('default', null)).toEqual(
      initialExpenseFilterRecord('default'),
    );
  });

  it('initial closed scope uses API closedBoard (no fixed status filter)', () => {
    expect(initialExpenseFilterRecord('closed')).toEqual({});
  });

  it('cleared closed scope keeps optional project drill-down only', () => {
    expect(clearedExpenseFilterRecord('closed', null)).toEqual({});
    expect(clearedExpenseFilterRecord('closed', 'proj-1')).toEqual({
      project: 'proj-1',
    });
  });
});
