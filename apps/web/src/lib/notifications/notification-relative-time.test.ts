import { describe, expect, it } from 'vitest';
import { formatNotificationInboxClockTime } from './notification-relative-time';

describe('formatNotificationInboxClockTime', () => {
  it('formats the arrival clock as HH:mm', () => {
    expect(formatNotificationInboxClockTime('2026-09-11T11:04:00.000Z', 'en-GB')).toMatch(
      /^\d{2}:\d{2}$/,
    );
  });

  it('returns empty for an invalid date', () => {
    expect(formatNotificationInboxClockTime('not-a-date', 'en-GB')).toBe('');
  });
});
