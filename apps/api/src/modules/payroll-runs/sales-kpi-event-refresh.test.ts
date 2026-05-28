import { describe, expect, it } from 'vitest';

import { earnedPeriodFromUtcDate } from './sales-kpi-event-refresh';

describe('earnedPeriodFromUtcDate', () => {
  it('uses UTC calendar month', () => {
    expect(earnedPeriodFromUtcDate(new Date('2026-03-31T23:00:00.000Z'))).toBe('2026-03');
    expect(earnedPeriodFromUtcDate(new Date('2026-04-01T00:00:00.000Z'))).toBe('2026-04');
  });
});
