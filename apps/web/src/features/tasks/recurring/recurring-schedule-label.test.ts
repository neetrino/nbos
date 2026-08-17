import { describe, expect, it } from 'vitest';
import { formatRecurringSchedule } from './recurring-schedule-label';

describe('formatRecurringSchedule', () => {
  it('formats weekly days', () => {
    expect(
      formatRecurringSchedule({
        frequency: 'WEEKLY',
        interval: 1,
        daysOfWeek: ['MO', 'WE'],
        dayOfMonth: null,
        startDate: '2026-05-04T09:00:00.000Z',
      }),
    ).toContain('Weekly on Mon, Wed');
  });

  it('formats monthly day', () => {
    expect(
      formatRecurringSchedule({
        frequency: 'MONTHLY',
        interval: 1,
        daysOfWeek: [],
        dayOfMonth: 10,
        startDate: '2026-05-10T09:00:00.000Z',
      }),
    ).toContain('Monthly on the 10th');
  });
});
