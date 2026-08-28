import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveInvoiceCreateSchedule } from './invoice-subscription-create-schedule';
import { yerevanCalendarDateKey } from './yerevan-calendar-date';

describe('resolveInvoiceCreateSchedule', () => {
  const prisma = {
    subscription: { findUnique: vi.fn() },
  };

  beforeEach(() => {
    prisma.subscription.findUnique.mockReset();
  });

  it('keeps +10 for non-subscription invoices without dueDate', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-26T15:00:00.000Z'));
    const schedule = await resolveInvoiceCreateSchedule(prisma as never, { type: 'MANUAL' });
    expect(schedule.coverageStartMonth).toBeNull();
    expect(schedule.dueDate.getDate()).toBe(5);
    expect(schedule.dueDate.getMonth()).toBe(5);
    vi.useRealTimers();
  });

  it('uses pay-day + 5 and coverage month when subscription dueDate is omitted', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ billingDay: 10 });
    const issued = new Date('2026-04-10T11:00:00+04:00');
    const schedule = await resolveInvoiceCreateSchedule(
      prisma as never,
      { subscriptionId: 'sub-1', type: 'SUBSCRIPTION' },
      issued,
    );
    expect(schedule.coverageStartMonth).toBe('2026-04');
    expect(yerevanCalendarDateKey(schedule.dueDate)).toBe('2026-04-15');
  });

  it('keeps explicit dueDate coverage on that date', async () => {
    const schedule = await resolveInvoiceCreateSchedule(prisma as never, {
      subscriptionId: 'sub-1',
      type: 'SUBSCRIPTION',
      dueDate: '2026-06-01T00:00:00.000Z',
    });
    expect(schedule.dueDate.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
  });
});
