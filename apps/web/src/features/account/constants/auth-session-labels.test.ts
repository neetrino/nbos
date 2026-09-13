import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSessionActivity } from './auth-session-labels';

describe('resolveSessionActivity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels the current device', () => {
    expect(resolveSessionActivity('2026-08-20T10:00:00.000Z', true)).toEqual({
      kind: 'thisDevice',
    });
  });

  it('handles missing activity', () => {
    expect(resolveSessionActivity(null, false)).toEqual({ kind: 'unknown' });
  });

  it('formats relative age', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    expect(resolveSessionActivity('2026-08-20T11:59:30.000Z', false)).toEqual({
      kind: 'activeNow',
    });
    expect(resolveSessionActivity('2026-08-20T11:40:00.000Z', false)).toEqual({
      kind: 'minutesAgo',
      count: 20,
    });
    expect(resolveSessionActivity('2026-08-20T09:00:00.000Z', false)).toEqual({
      kind: 'hoursAgo',
      count: 3,
    });
    expect(resolveSessionActivity('2026-08-18T12:00:00.000Z', false)).toEqual({
      kind: 'daysAgo',
      count: 2,
    });
  });
});
