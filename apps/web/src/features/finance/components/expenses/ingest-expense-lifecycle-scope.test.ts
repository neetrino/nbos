import { describe, expect, it } from 'vitest';
import { DEFAULT_BOARD_LIFECYCLE_SCOPE } from '@/features/shared/board-lifecycle';
import {
  applyExpenseLifecycleScopeFilter,
  isExpenseLifecycleScopeQuery,
  mergePayNowFiltersForList,
  peekExpenseLifecycleScopeQuery,
  stripLegacyExpenseStatusFilter,
} from './ingest-expense-lifecycle-scope';

describe('isExpenseLifecycleScopeQuery', () => {
  it('accepts only lifecycle query values', () => {
    expect(isExpenseLifecycleScopeQuery('ALL')).toBe(true);
    expect(isExpenseLifecycleScopeQuery('ACTIVE')).toBe(true);
    expect(isExpenseLifecycleScopeQuery('CLOSED')).toBe(true);
    expect(isExpenseLifecycleScopeQuery('closed')).toBe(false);
    expect(isExpenseLifecycleScopeQuery(null)).toBe(false);
  });
});

describe('applyExpenseLifecycleScopeFilter', () => {
  it('stores Closed and drops the default Active key', () => {
    expect(applyExpenseLifecycleScopeFilter({ category: 'TOOLS' }, 'CLOSED')).toEqual({
      category: 'TOOLS',
      boardScope: 'CLOSED',
    });
    expect(
      applyExpenseLifecycleScopeFilter({ boardScope: 'CLOSED' }, DEFAULT_BOARD_LIFECYCLE_SCOPE),
    ).toEqual({});
  });
});

describe('mergePayNowFiltersForList', () => {
  it('applies URL scope before persist and drops leftover status', () => {
    expect(peekExpenseLifecycleScopeQuery('CLOSED')).toBe('CLOSED');
    expect(peekExpenseLifecycleScopeQuery('nope')).toBeNull();
    expect(stripLegacyExpenseStatusFilter({ status: 'BACKLOG', category: 'TOOLS' })).toEqual({
      category: 'TOOLS',
    });
    expect(
      mergePayNowFiltersForList({
        filters: { status: 'BACKLOG', boardScope: 'ACTIVE' },
        urlLifecycleScope: 'CLOSED',
        stripStatus: true,
      }),
    ).toEqual({ boardScope: 'CLOSED' });
  });
});
