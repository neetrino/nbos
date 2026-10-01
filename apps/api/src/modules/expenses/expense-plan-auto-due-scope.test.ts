import { describe, expect, it } from 'vitest';
import { endOfUtcDayUtc, endOfYerevanMonthUtc } from './expense-plan-auto-due-scope';

describe('endOfUtcDayUtc', () => {
  it('returns end of the same UTC calendar day', () => {
    const end = endOfUtcDayUtc(new Date('2026-06-15T04:00:00.000Z'));
    expect(end.toISOString()).toBe('2026-06-15T23:59:59.999Z');
  });
});

describe('endOfYerevanMonthUtc', () => {
  it('uses October when the job runs at 02:00 Yerevan on the 1st', () => {
    const end = endOfYerevanMonthUtc(new Date('2026-09-30T22:00:00.000Z'));
    expect(end.toISOString()).toBe('2026-10-31T23:59:59.999Z');
  });

  it('stops before the next month', () => {
    const end = endOfYerevanMonthUtc(new Date('2026-10-31T20:00:00.000Z'));
    expect(end.toISOString()).toBe('2026-11-30T23:59:59.999Z');
  });
});
