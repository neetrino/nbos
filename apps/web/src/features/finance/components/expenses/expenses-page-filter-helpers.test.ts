import { describe, expect, it } from 'vitest';
import {
  clearedExpenseFilterRecord,
  initialExpenseFilterRecord,
} from './expenses-page-filter-helpers';

describe('expenses-page-filter-helpers', () => {
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
