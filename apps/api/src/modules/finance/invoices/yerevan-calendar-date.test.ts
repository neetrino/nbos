import { describe, expect, it } from 'vitest';
import {
  addCalendarDaysToKey,
  isYerevanDueOffsetDay,
  yerevanCalendarDateKey,
} from './yerevan-calendar-date';

describe('yerevan-calendar-date', () => {
  it('formats Asia/Yerevan calendar date (not raw UTC midnight)', () => {
    // 2026-05-05 22:00 UTC = 2026-05-06 02:00 in Yerevan (+04)
    const lateUtc = new Date('2026-05-05T22:00:00.000Z');
    expect(yerevanCalendarDateKey(lateUtc)).toBe('2026-05-06');
  });

  it('matches exact dueDate - offsetDays on Yerevan calendar', () => {
    const due = new Date('2026-05-15T00:00:00+04:00');
    const d10 = new Date('2026-05-05T15:00:00+04:00');
    const d2 = new Date('2026-05-13T08:00:00+04:00');
    expect(isYerevanDueOffsetDay(d10, due, 10)).toBe(true);
    expect(isYerevanDueOffsetDay(d2, due, 2)).toBe(true);
    expect(isYerevanDueOffsetDay(d10, due, 2)).toBe(false);
  });

  it('does not catch up a missed offset day', () => {
    const due = new Date('2026-05-15T00:00:00+04:00');
    const dayAfterD10 = new Date('2026-05-06T12:00:00+04:00');
    expect(isYerevanDueOffsetDay(dayAfterD10, due, 10)).toBe(false);
  });

  it('adds calendar days to YYYY-MM-DD keys', () => {
    expect(addCalendarDaysToKey('2026-05-15', -10)).toBe('2026-05-05');
    expect(addCalendarDaysToKey('2026-03-01', -2)).toBe('2026-02-27');
  });
});
