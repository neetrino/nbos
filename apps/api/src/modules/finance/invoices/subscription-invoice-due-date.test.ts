import { describe, expect, it } from 'vitest';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';
import { resolveSubscriptionInvoiceDueDate } from './subscription-invoice-due-date';

function yerevanNoon(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00+04:00`);
}

describe('resolveSubscriptionInvoiceDueDate', () => {
  it('gives 5 calendar days after an on-time issue', () => {
    const due = resolveSubscriptionInvoiceDueDate({
      expectedPayDate: yerevanNoon('2026-04-10'),
      issuedOn: yerevanNoon('2026-04-10'),
    });
    expect(yerevanCalendarDateKey(due)).toBe('2026-04-15');
  });

  it('anchors a late issue to the create day', () => {
    const due = resolveSubscriptionInvoiceDueDate({
      expectedPayDate: yerevanNoon('2026-04-10'),
      issuedOn: yerevanNoon('2026-04-14'),
    });
    expect(yerevanCalendarDateKey(due)).toBe('2026-04-19');
  });

  it('keeps the pay day when issued early for day 1', () => {
    const due = resolveSubscriptionInvoiceDueDate({
      expectedPayDate: yerevanNoon('2026-04-01'),
      issuedOn: yerevanNoon('2026-03-28'),
    });
    expect(yerevanCalendarDateKey(due)).toBe('2026-04-06');
  });
});
