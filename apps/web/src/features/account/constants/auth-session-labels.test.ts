import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatSessionActivity } from './auth-session-labels';

describe('formatSessionActivity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels the current device', () => {
    expect(formatSessionActivity('2026-08-20T10:00:00.000Z', true)).toBe('This device');
  });

  it('handles missing activity', () => {
    expect(formatSessionActivity(null, false)).toBe('Unknown activity');
  });

  it('formats relative age', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    expect(formatSessionActivity('2026-08-20T11:59:30.000Z', false)).toBe('Active now');
    expect(formatSessionActivity('2026-08-20T11:40:00.000Z', false)).toBe('20 min ago');
    expect(formatSessionActivity('2026-08-20T09:00:00.000Z', false)).toBe('3h ago');
    expect(formatSessionActivity('2026-08-18T12:00:00.000Z', false)).toBe('2d ago');
  });
});
