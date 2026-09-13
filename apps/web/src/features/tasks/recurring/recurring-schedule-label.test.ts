import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import enTasks from '@/messages/en/tasks.json';
import ruTasks from '@/messages/ru/tasks.json';
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

  it('formats weekly days from the Russian catalog', () => {
    const t = createTranslator({ locale: 'ru', messages: { tasks: ruTasks } });
    expect(
      formatRecurringSchedule(
        {
          frequency: 'WEEKLY',
          interval: 1,
          daysOfWeek: ['MO', 'WE'],
          dayOfMonth: null,
          startDate: '2026-05-04T09:00:00.000Z',
        },
        (key, values) => t(`tasks.${key}`, values),
      ),
    ).toContain('Еженедельно по Пн, Ср');
  });

  it('formats monthly day from the English catalog without ordinal suffixes', () => {
    const t = createTranslator({ locale: 'en', messages: { tasks: enTasks } });
    expect(
      formatRecurringSchedule(
        {
          frequency: 'MONTHLY',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: 10,
          startDate: '2026-05-10T09:00:00.000Z',
        },
        (key, values) => t(`tasks.${key}`, values),
      ),
    ).toContain('Monthly on the 10 at');
  });
});
