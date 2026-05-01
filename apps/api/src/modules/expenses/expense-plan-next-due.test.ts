import { describe, it, expect } from 'vitest';
import { planNextDueAfterOccurrence } from './expense-plan-next-due';

describe('planNextDueAfterOccurrence', () => {
  it('returns null for ONE_TIME', () => {
    const d = new Date('2026-06-15T00:00:00.000Z');
    expect(planNextDueAfterOccurrence(d, 'ONE_TIME')).toBeNull();
  });

  it('adds one month for MONTHLY', () => {
    const d = new Date('2026-01-15T00:00:00.000Z');
    const next = planNextDueAfterOccurrence(d, 'MONTHLY');
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });
});
