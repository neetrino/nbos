import { Decimal } from '@nbos/database';
import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { MrrSubscriptionRevenueService } from './mrr-subscription-revenue.service';

type AggregateArgs = {
  where?: {
    status?: string;
    billingStartDate?: unknown;
    endDate?: unknown;
  };
};

describe('MrrSubscriptionRevenueService', () => {
  it('builds active MRR, movement and paid subscription revenue', async () => {
    const prisma = createMockPrisma();
    prisma.subscription.count.mockResolvedValue(3);
    prisma.subscription.aggregate
      .mockResolvedValueOnce({ _sum: { monthlyEquivalentAmount: new Decimal(900) } })
      .mockResolvedValueOnce({
        _count: { _all: 2 },
        _sum: { monthlyEquivalentAmount: new Decimal(500) },
      })
      .mockResolvedValueOnce({
        _count: { _all: 1 },
        _sum: { monthlyEquivalentAmount: new Decimal(200) },
      })
      .mockResolvedValueOnce({
        _count: { _all: 0 },
        _sum: { monthlyEquivalentAmount: null },
      });
    prisma.subscription.groupBy.mockResolvedValue([
      {
        type: 'MAINTENANCE_ONLY',
        _count: { _all: 2 },
        _sum: { monthlyEquivalentAmount: new Decimal(600) },
      },
      {
        type: 'DEV_ONLY',
        _count: { _all: 1 },
        _sum: { monthlyEquivalentAmount: new Decimal(300) },
      },
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
      completedMrr: '0.00',
      completedSubscriptionCount: 0,
    });
    expect(report.paidRevenue).toEqual({
      paidSubscriptionRevenue: '700.00',
      paymentCount: 4,
      invoicedSubscriptionAmount: '850.00',
      invoiceCount: 5,
    });
  });

  it('counts CANCELLED subscriptions as churn and COMPLETED subscriptions separately', async () => {
    const prisma = createMockPrisma();
    prisma.subscription.count.mockResolvedValue(0);
    prisma.subscription.groupBy.mockResolvedValue([]);
    prisma.subscription.aggregate.mockImplementation((args: AggregateArgs) => {
      if (args.where?.status === 'CANCELLED') {
        return Promise.resolve({
          _count: { _all: 1 },
          _sum: { monthlyEquivalentAmount: new Decimal(150) },
        });
      }
      if (args.where?.status === 'COMPLETED') {
        return Promise.resolve({
          _count: { _all: 2 },
          _sum: { monthlyEquivalentAmount: new Decimal(400) },
        });
      }
      if (args.where?.billingStartDate) {
        return Promise.resolve({
          _count: { _all: 0 },
          _sum: { monthlyEquivalentAmount: null },
        });
      }
      return Promise.resolve({ _sum: { monthlyEquivalentAmount: null } });
    });
    prisma.payment.count.mockResolvedValue(0);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.invoice.count.mockResolvedValue(0);
    prisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const report = await new MrrSubscriptionRevenueService(prisma as never).getReport({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    expect(report.movement).toMatchObject({
      churnedMrr: '150.00',
      churnedSubscriptionCount: 1,
      completedMrr: '400.00',
      completedSubscriptionCount: 2,
    });

    const cancelledCall = prisma.subscription.aggregate.mock.calls.find(
      ([args]) => (args as AggregateArgs).where?.status === 'CANCELLED',
    );
    const completedCall = prisma.subscription.aggregate.mock.calls.find(
      ([args]) => (args as AggregateArgs).where?.status === 'COMPLETED',
    );
    expect(cancelledCall).toBeDefined();
    expect(completedCall).toBeDefined();
    expect((cancelledCall?.[0] as AggregateArgs).where?.status).toBe('CANCELLED');
    expect((completedCall?.[0] as AggregateArgs).where?.status).toBe('COMPLETED');
    expect((cancelledCall?.[0] as AggregateArgs).where?.endDate).toEqual(
      (completedCall?.[0] as AggregateArgs).where?.endDate,
    );
  });
});
