import { describe, expect, it } from 'vitest';
import { classifyNotificationAge } from './notification-relative-time';

describe('classifyNotificationAge', () => {
  const now = new Date('2026-09-12T12:00:00.000Z');

  it('classifies just now, minutes, hours, yesterday, and absolute days', () => {
    expect(classifyNotificationAge(new Date(now.getTime() - 20_000).toISOString(), now)).toEqual({
      type: 'justNow',
    });
    expect(
      classifyNotificationAge(new Date(now.getTime() - 5 * 60_000).toISOString(), now),
    ).toEqual({ type: 'minutes', count: 5 });
    expect(
      classifyNotificationAge(new Date(now.getTime() - 3 * 60 * 60_000).toISOString(), now),
    ).toEqual({ type: 'hours', count: 3 });
    expect(
      classifyNotificationAge(new Date(now.getTime() - 26 * 60 * 60_000).toISOString(), now),
    ).toEqual({ type: 'yesterday' });
    expect(
      classifyNotificationAge(new Date(now.getTime() - 10 * 24 * 60 * 60_000).toISOString(), now),
    ).toEqual({ type: 'absolute' });
  });
});
