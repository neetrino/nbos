import { afterEach, describe, expect, it } from 'vitest';
import { resolveSchedulerSlot } from './scheduler-slot';

const DAILY = '0 11 * * *';
const WEEKLY = '30 3 * * 0';
const MONTHLY = '0 8 1 * *';
const DAILY_SLOT = '2026-10-07T07:00:00.000Z';
const WEEKLY_SLOT = '2026-10-03T23:30:00.000Z';
const MONTHLY_SLOT = '2026-10-01T04:00:00.000Z';

describe('scheduler slot resolution', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it.each([
    ['daily', DAILY, DAILY_SLOT],
    ['weekly', WEEKLY, WEEKLY_SLOT],
    ['monthly', MONTHLY, MONTHLY_SLOT],
  ])('keeps the %s slot 10ms, 30s, and 20min after it fires', (_label, expression, slot) => {
    const scheduled = new Date(slot);
    for (const delayMs of [10, 30_000, 20 * 60_000]) {
      const tick = new Date(scheduled.getTime() + delayMs);
      expect(resolveSchedulerSlot(expression, tick).toISOString()).toBe(slot);
    }
  });

  it('finds the previous Sunday when the weekly fire is more than 48 hours behind', () => {
    const wednesday = new Date('2026-10-06T23:30:00.000Z');
    expect(resolveSchedulerSlot(WEEKLY, wednesday).toISOString()).toBe(WEEKLY_SLOT);
  });

  it('finds the 1st of the month when that fire is more than 48 hours behind', () => {
    const later = new Date('2026-10-04T04:00:00.000Z');
    expect(resolveSchedulerSlot(MONTHLY, later).toISOString()).toBe(MONTHLY_SLOT);
  });

  it.each(['UTC', 'America/Los_Angeles', 'Europe/Berlin'])(
    'returns the same absolute instant when the host TZ is %s',
    (timeZone) => {
      process.env.TZ = timeZone;
      expect(resolveSchedulerSlot(DAILY, new Date('2026-10-07T07:20:00.000Z')).toISOString()).toBe(
        DAILY_SLOT,
      );
      expect(resolveSchedulerSlot(WEEKLY, new Date('2026-10-03T23:50:00.000Z')).toISOString()).toBe(
        WEEKLY_SLOT,
      );
      expect(
        resolveSchedulerSlot(MONTHLY, new Date('2026-10-01T04:20:00.000Z')).toISOString(),
      ).toBe(MONTHLY_SLOT);
    },
  );
});
