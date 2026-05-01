import { describe, expect, it } from 'vitest';
import { endOfUtcDayUtc } from './expense-plan-auto-due-scope';

describe('endOfUtcDayUtc', () => {
  it('returns end of the same UTC calendar day', () => {
    const end = endOfUtcDayUtc(new Date('2026-06-15T04:00:00.000Z'));
    expect(end.toISOString()).toBe('2026-06-15T23:59:59.999Z');
  });
});
