import { describe, expect, it } from 'vitest';
import {
  describeCronExpression,
  parseCronExpression,
  splitSchedulerWhen,
} from './scheduler-cron-format';

describe('scheduler-cron-format', () => {
  it('parses five fields', () => {
    expect(parseCronExpression('0 3 1 * *')).toEqual({
      minute: '0',
      hour: '3',
      dayOfMonth: '1',
      month: '*',
      dayOfWeek: '*',
    });
  });

  it('describes common patterns', () => {
    expect(describeCronExpression('0 3 1 * *')).toBe('1st of every month at 03:00');
    expect(describeCronExpression('*/10 * * * *')).toBe('Every 10 minutes');
    expect(describeCronExpression('0 11 * * *')).toBe('Every day at 11:00');
    expect(describeCronExpression('30 3 * * 0')).toBe('Every Sunday at 03:30');
  });

  it('splits day-time above month-year', () => {
    const parts = splitSchedulerWhen('2026-08-20T15:02:00.000Z', 'UTC');
    expect(parts?.primary).toMatch(/20 · 15:02/);
    expect(parts?.secondary).toBe('Aug 2026');
  });
});
