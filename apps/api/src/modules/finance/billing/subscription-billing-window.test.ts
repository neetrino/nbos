import { describe, expect, it } from 'vitest';
import {
  isSubscriptionOpenForTarget,
  penultimateWeekdayKey,
  resolveSubscriptionBillingTarget,
} from './subscription-billing-window';

function yerevanNoon(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00+04:00`);
}

describe('penultimateWeekdayKey', () => {
  it('returns 30 March 2026 (Monday before Tuesday month end)', () => {
    expect(penultimateWeekdayKey(2026, 3)).toBe('2026-03-30');
  });

  it('returns 26 February 2026 (Thursday before Friday, month ends Saturday)', () => {
    expect(penultimateWeekdayKey(2026, 2)).toBe('2026-02-26');
  });
});

describe('resolveSubscriptionBillingTarget', () => {
  it('issues day-1 next month on the penultimate weekday', () => {
    const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-03-30'), 1);
    expect(target?.coverageMonthKey).toBe('2026-04');
    expect(target?.expectedPayKey).toBe('2026-04-01');
  });

  it('does not issue day 2–5 early', () => {
    for (const day of [2, 3, 4, 5]) {
      const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-03-30'), day);
      expect(target?.coverageMonthKey).toBe('2026-03');
    }
  });

  it('catches up day-1 current month before the early window', () => {
    const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-03-15'), 1);
    expect(target?.coverageMonthKey).toBe('2026-03');
  });

  it('bills days 2–31 for the current month from the 1st', () => {
    const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-04-01'), 15);
    expect(target?.coverageMonthKey).toBe('2026-04');
    expect(target?.expectedPayKey).toBe('2026-04-15');
  });

  it('catches up a late day-15 run on the 2nd', () => {
    const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-04-02'), 15);
    expect(target?.coverageMonthKey).toBe('2026-04');
  });

  it('clamps day 31 onto February 28', () => {
    const target = resolveSubscriptionBillingTarget(yerevanNoon('2026-02-10'), 31);
    expect(target?.expectedPayKey).toBe('2026-02-28');
  });
});

describe('isSubscriptionOpenForTarget', () => {
  it('allows billingStartDate on the expected pay day of the next month', () => {
    expect(
      isSubscriptionOpenForTarget({
        billingStartDate: yerevanNoon('2026-04-01'),
        endDate: null,
        expectedPayKey: '2026-04-01',
      }),
    ).toBe(true);
  });

  it('skips a target month after endDate', () => {
    expect(
      isSubscriptionOpenForTarget({
        billingStartDate: yerevanNoon('2026-01-01'),
        endDate: yerevanNoon('2026-03-31'),
        expectedPayKey: '2026-04-01',
      }),
    ).toBe(false);
  });
});
