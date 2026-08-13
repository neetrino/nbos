import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { Decimal } from '@nbos/database';
import { PartnerAccrualSubscriptionService } from './partner-accrual-subscription.service';
import { heldSubscriptionAccrualWhere } from './partner-accrual-subscription.ops';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

describe('PartnerAccrualSubscriptionService', () => {
  let prisma: MockPrisma;
  const operationalJournal = { appendPartnerAccrualLine: vi.fn().mockResolvedValue(undefined) };
  let service: PartnerAccrualSubscriptionService;

  const partnerDeal = {
    source: 'PARTNER' as const,
    sourcePartnerId: 'p1',
    partnerReferralTerms: {
      id: 'rt1',
      partnerId: 'p1',
      partnerPercent: new Decimal('10'),
      dealType: 'MAINTENANCE' as const,
      paymentType: null as 'SUBSCRIPTION' | null,
    },
  };

  const subscriptionInvoiceBase = {
    id: 'inv1',
    moneyStatus: 'PAID' as const,
    type: 'SUBSCRIPTION' as const,
    projectId: 'pr1',
    orderId: 'ord1' as string | null,
    subscriptionId: 'sub1',
    companyId: 'c1',
    subscription: { partnerId: 'p1' as string | null, type: 'MAINTENANCE_ONLY' },
  };

  const openProductOrder = {
    id: 'ord1',
    projectId: 'pr1',
    dealId: 'd1',
    productId: 'prod1' as string | null,
    extensionId: null as string | null,
    paymentType: 'SUBSCRIPTION' as const,
    deal: partnerDeal,
    product: { status: 'DEVELOPMENT' } as { status: string } | null,
    extension: null as { status: string } | null,
  };

  function mockPaidFlow(input?: {
    subscriptionType?: string;
    order?: Partial<typeof openProductOrder>;
  }) {
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.invoice.findUnique.mockResolvedValue({
      ...subscriptionInvoiceBase,
      subscription: {
        partnerId: 'p1',
        type: input?.subscriptionType ?? 'MAINTENANCE_ONLY',
      },
    });
    prisma.order.findUnique.mockResolvedValue({
      ...openProductOrder,
      ...input?.order,
    });
    prisma.payment.findUnique.mockResolvedValue({
      paymentDate: new Date('2026-01-15'),
      amount: new Decimal('1000'),
    });
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa-new' });
  }

  beforeEach(() => {
    prisma = createMockPrisma();
    operationalJournal.appendPartnerAccrualLine.mockReset();
    operationalJournal.appendPartnerAccrualLine.mockResolvedValue(undefined);
    service = new PartnerAccrualSubscriptionService(prisma as never, operationalJournal as never);
  });

  it('returns early when partner accrual already exists for payment', async () => {
    prisma.partnerAccrual.findUnique.mockResolvedValue({ id: 'existing' });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.invoice.findUnique).not.toHaveBeenCalled();
  });

  it('skips non-subscription invoices', async () => {
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.invoice.findUnique.mockResolvedValue({
      ...subscriptionInvoiceBase,
      type: 'DEVELOPMENT',
    });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(prisma.partnerAccrual.create).not.toHaveBeenCalled();
  });

  it('creates accrual with base from payment amount and appends journal line', async () => {
    mockPaidFlow();

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: 'pay1',
          subscriptionId: 'sub1',
          invoiceId: 'inv1',
          orderId: 'ord1',
          baseAmount: new Decimal('1000'),
          amount: new Decimal('100.00'),
        }),
      }),
    );
    expect(operationalJournal.appendPartnerAccrualLine).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerAccrualId: 'pa-new',
        amount: 100,
        partnerId: 'p1',
        orderId: 'ord1',
      }),
    );
  });

  it('resolves order via findFirst scoped by subscription partner when orderId is null', async () => {
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.invoice.findUnique.mockResolvedValue({
      ...subscriptionInvoiceBase,
      orderId: null,
    });
    prisma.order.findFirst.mockResolvedValue(openProductOrder);
    prisma.payment.findUnique.mockResolvedValue({
      paymentDate: new Date('2026-01-15'),
      amount: new Decimal('500'),
    });
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa2' });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.order.findUnique).not.toHaveBeenCalled();
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: 'pr1',
          deal: expect.objectContaining({ sourcePartnerId: 'p1' }),
        }),
      }),
    );
  });

  it('deletes accrual row when journal append fails', async () => {
    mockPaidFlow();
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa-rollback' });
    operationalJournal.appendPartnerAccrualLine.mockRejectedValue(new Error('journal down'));

    await expect(
      service.tryInboundSubscriptionAfterClientPayment({ invoiceId: 'inv1', paymentId: 'pay1' }),
    ).rejects.toThrow('journal down');

    expect(prisma.partnerAccrual.delete).toHaveBeenCalledWith({ where: { id: 'pa-rollback' } });
  });

  it('holds DEV_ONLY accrual as ACCRUED when delivery is not complete', async () => {
    mockPaidFlow({ subscriptionType: 'DEV_ONLY' });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACCRUED', eligibleAt: null }),
      }),
    );
    expect(operationalJournal.appendPartnerAccrualLine).toHaveBeenCalled();
  });

  it('holds DEV_AND_MAINTENANCE accrual as ACCRUED when delivery is not complete', async () => {
    mockPaidFlow({ subscriptionType: 'DEV_AND_MAINTENANCE' });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'ACCRUED', eligibleAt: null }),
      }),
    );
  });

  it('creates MAINTENANCE_ONLY accrual as ELIGIBLE immediately', async () => {
    mockPaidFlow({ subscriptionType: 'MAINTENANCE_ONLY' });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ELIGIBLE',
          eligibleAt: expect.any(Date),
        }),
      }),
    );
  });

  it('creates DEV_ONLY accrual as ELIGIBLE when product is already DONE', async () => {
    mockPaidFlow({
      subscriptionType: 'DEV_ONLY',
      order: { product: { status: 'DONE' } },
    });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ELIGIBLE',
          eligibleAt: expect.any(Date),
        }),
      }),
    );
  });

  it('creates ELIGIBLE and warns when DEV_ONLY order has no delivery carrier', async () => {
    const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    mockPaidFlow({
      subscriptionType: 'DEV_ONLY',
      order: { productId: null, extensionId: null, product: null, extension: null },
    });

    await service.tryInboundSubscriptionAfterClientPayment({
      invoiceId: 'inv1',
      paymentId: 'pay1',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ELIGIBLE',
          eligibleAt: expect.any(Date),
        }),
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord1',
        reason: 'order has neither productId nor extensionId',
      }),
      expect.stringContaining('no delivery carrier'),
    );
    warnSpy.mockRestore();
  });

  it('release flips only ACCRUED subscription rows of that order', async () => {
    prisma.partnerAccrual.aggregate.mockResolvedValue({
      _sum: { amount: new Decimal('150.00') },
    });
    prisma.partnerAccrual.updateMany.mockResolvedValue({ count: 2 });

    await service.releaseHeldAccrualsAfterDelivery('ord1');

    expect(prisma.partnerAccrual.updateMany).toHaveBeenCalledWith({
      where: heldSubscriptionAccrualWhere('ord1'),
      data: { status: 'ELIGIBLE', eligibleAt: expect.any(Date) },
    });
    expect(operationalJournal.appendPartnerAccrualLine).not.toHaveBeenCalled();
  });

  it('release called twice is a no-op the second time', async () => {
    prisma.partnerAccrual.aggregate
      .mockResolvedValueOnce({
        _sum: { amount: new Decimal('40.00') },
      })
      .mockResolvedValueOnce({
        _sum: { amount: null },
      });
    prisma.partnerAccrual.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await service.releaseHeldAccrualsAfterDelivery('ord1');
    await service.releaseHeldAccrualsAfterDelivery('ord1');

    expect(prisma.partnerAccrual.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.partnerAccrual.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: heldSubscriptionAccrualWhere('ord1'),
      }),
    );
    expect(operationalJournal.appendPartnerAccrualLine).not.toHaveBeenCalled();
  });

  it('release does not touch the operational journal', async () => {
    prisma.partnerAccrual.aggregate.mockResolvedValue({
      _sum: { amount: new Decimal('10.00') },
    });
    prisma.partnerAccrual.updateMany.mockResolvedValue({ count: 1 });

    await service.releaseHeldAccrualsAfterDelivery('ord1');

    expect(operationalJournal.appendPartnerAccrualLine).not.toHaveBeenCalled();
  });
});
