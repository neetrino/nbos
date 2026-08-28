import { describe, expect, it, vi } from 'vitest';
import { extendSubscriptionDueDateAfterOfficialSend } from './invoice-official-due-date-extend';

describe('extendSubscriptionDueDateAfterOfficialSend', () => {
  it('extends dueDate when official send is later than the pay-day window', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          dueDate: new Date('2026-04-15T00:00:00+04:00'),
          coverageStartMonth: '2026-04',
          subscription: { billingDay: 10 },
        }),
        update,
      },
    };

    await extendSubscriptionDueDateAfterOfficialSend(
      prisma as never,
      'inv-1',
      new Date('2026-04-15T11:00:00+04:00'),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { dueDate: new Date('2026-04-20T00:00:00+04:00') },
    });
  });

  it('does not shrink an early day-1 dueDate', async () => {
    const update = vi.fn();
    const prisma = {
      invoice: {
        findUnique: vi.fn().mockResolvedValue({
          dueDate: new Date('2026-04-06T00:00:00+04:00'),
          coverageStartMonth: '2026-04',
          subscription: { billingDay: 1 },
        }),
        update,
      },
    };

    await extendSubscriptionDueDateAfterOfficialSend(
      prisma as never,
      'inv-1',
      new Date('2026-03-30T11:00:00+04:00'),
    );

    expect(update).not.toHaveBeenCalled();
  });
});
