import { describe, expect, it } from 'vitest';
import {
  clearedExpenseFilterRecord,
  initialExpenseFilterRecord,
} from './expenses-page-filter-helpers';

describe('expenses-page-filter-helpers', () => {
  it('initial closed scope is PAID', () => {
    expect(initialExpenseFilterRecord('closed')).toEqual({ status: 'PAID' });
  });

  it('cleared closed scope preserves PAID and optional project drill-down', () => {
    expect(clearedExpenseFilterRecord('closed', null)).toEqual({ status: 'PAID' });
    expect(clearedExpenseFilterRecord('closed', 'proj-1')).toEqual({
      status: 'PAID',
      project: 'proj-1',
    });
  });
});
