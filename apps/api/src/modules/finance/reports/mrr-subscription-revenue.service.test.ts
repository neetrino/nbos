import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { MrrSubscriptionRevenueService } from './mrr-subscription-revenue.service';

describe('MrrSubscriptionRevenueService', () => {
  it('builds active MRR, movement and paid subscription revenue', async () => {
    const prisma = createMockPrisma();
    prisma.subscription.count.mockResolvedValue(3);
    prisma.subscription.aggregate
      .mockResolvedValueOnce({ _sum: { baseMonthlyAmount: new Decimal(900) } })
      .mockResolvedValueOnce({ _count: 2, _sum: { baseMonthlyAmount: new Decimal(500) } })
      .mockResolvedValueOnce({ _count: 1, _sum: { baseMonthlyAmount: new Decimal(200) } });
    prisma.subscription.groupBy.mockResolvedValue([
      { type: 'MAINTENANCE_ONLY', _count: 2, _sum: { baseMonthlyAmount: new Decimal(600) } },
      { type: 'DEV_ONLY', _count: 1, _sum: { baseMonthlyAmount: new Decimal(300) } },
    ]);
    prisma.payment.count.mockResolvedValue(4);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(700) } });
    prisma.invoice.count.mockResolvedValue(5);
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(850) } });

    const report = await new MrrSubscriptionRevenueService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(report.active).toEqual({
      activeMrr: '900.00',
      activeSubscriptionCount: 3,
      byType: [
        { type: 'DEV_ONLY', activeSubscriptionCount: 1, activeMrr: '300.00' },
        { type: 'MAINTENANCE_ONLY', activeSubscriptionCount: 2, activeMrr: '600.00' },
      ],
    });
    expect(report.movement).toEqual({
      newMrr: '500.00',
      newSubscriptionCount: 2,
      churnedMrr: '200.00',
      churnedSubscriptionCount: 1,
    });
    expect(report.paidRevenue).toEqual({
      paidSubscriptionRevenue: '700.00',
      paymentCount: 4,
      invoicedSubscriptionAmount: '850.00',
      invoiceCount: 5,
    });
  });
});
