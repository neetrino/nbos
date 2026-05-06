import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { PartnerAccrualSubscriptionService } from './partner-accrual-subscription.service';
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
    subscription: { partnerId: 'p1' as string | null },
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    operationalJournal.appendPartnerAccrualLine.mockClear();
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
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.invoice.findUnique.mockResolvedValue(subscriptionInvoiceBase);
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'pr1',
      dealId: 'd1',
      productId: 'prod1',
      paymentType: 'SUBSCRIPTION',
      deal: partnerDeal,
    });
    prisma.payment.findUnique.mockResolvedValue({
      paymentDate: new Date('2026-01-15'),
      amount: new Decimal('1000'),
    });
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa-new' });

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
    prisma.order.findFirst.mockResolvedValue({
      id: 'ord2',
      projectId: 'pr1',
      dealId: 'd1',
      productId: 'prod1',
      paymentType: 'SUBSCRIPTION',
      deal: partnerDeal,
    });
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
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.invoice.findUnique.mockResolvedValue(subscriptionInvoiceBase);
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord1',
      projectId: 'pr1',
      dealId: 'd1',
      productId: 'prod1',
      paymentType: 'SUBSCRIPTION',
      deal: partnerDeal,
    });
    prisma.payment.findUnique.mockResolvedValue({
      paymentDate: new Date('2026-01-15'),
      amount: new Decimal('100'),
    });
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa-rollback' });
    operationalJournal.appendPartnerAccrualLine.mockRejectedValue(new Error('journal down'));

    await expect(
      service.tryInboundSubscriptionAfterClientPayment({ invoiceId: 'inv1', paymentId: 'pay1' }),
    ).rejects.toThrow('journal down');

    expect(prisma.partnerAccrual.delete).toHaveBeenCalledWith({ where: { id: 'pa-rollback' } });
  });
});
