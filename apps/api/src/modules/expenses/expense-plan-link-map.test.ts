import { describe, it, expect } from 'vitest';
import { mapExpensePlanToLinkedPlan } from './expense-plan-link-map';

describe('mapExpensePlanToLinkedPlan', () => {
  it('returns null when plan missing or name empty', () => {
    expect(mapExpensePlanToLinkedPlan(null)).toBeNull();
    expect(mapExpensePlanToLinkedPlan(undefined)).toBeNull();
    expect(mapExpensePlanToLinkedPlan({ id: 'p1', name: '   ' })).toBeNull();
  });

  it('returns trimmed id and name', () => {
    expect(mapExpensePlanToLinkedPlan({ id: 'p1', name: '  Office rent  ' })).toEqual({
      id: 'p1',
      name: 'Office rent',
    });
  });
});
