import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { PartnerAccrualClassicService } from './partner-accrual-classic.service';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

describe('PartnerAccrualClassicService', () => {
  let prisma: MockPrisma;
  const operationalJournal = { appendPartnerAccrualLine: vi.fn().mockResolvedValue(undefined) };
  let service: PartnerAccrualClassicService;

  const partnerDeal = {
    source: 'PARTNER' as const,
    sourcePartnerId: 'p1',
    partnerReferralTerms: {
      id: 'rt1',
      partnerId: 'p1',
      partnerPercent: new Decimal('10'),
      dealType: 'PRODUCT' as const,
      paymentType: 'CLASSIC' as const,
    },
  };

  const classicOrderBase = {
    id: 'ord1',
    status: 'FULLY_PAID' as const,
    projectId: 'pr1',
    dealId: 'd1',
    productId: 'prod1' as string | null,
    extensionId: null as string | null,
    paymentType: 'CLASSIC' as 'CLASSIC' | 'SUBSCRIPTION',
    totalAmount: new Decimal('150000'),
    product: { status: 'DONE' } as { status: string } | null,
    extension: null as { status: string } | null,
    deal: partnerDeal,
  };

  function mockClassicFlow(order: Partial<typeof classicOrderBase> = {}) {
    prisma.partnerAccrual.findUnique.mockResolvedValue(null);
    prisma.partnerAccrual.findFirst.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      ...classicOrderBase,
      ...order,
    });
    prisma.invoice.findUnique.mockResolvedValue({ companyId: 'c1' });
    prisma.payment.findUnique.mockResolvedValue({ paymentDate: new Date('2026-03-12') });
    prisma.partnerAccrual.create.mockResolvedValue({ id: 'pa-classic' });
  }

  beforeEach(() => {
    prisma = createMockPrisma();
    operationalJournal.appendPartnerAccrualLine.mockReset();
    operationalJournal.appendPartnerAccrualLine.mockResolvedValue(undefined);
    service = new PartnerAccrualClassicService(prisma as never, operationalJournal as never);
  });

  it('does not create accrual after a deposit-only payment while the order is PARTIALLY_PAID', async () => {
    mockClassicFlow({ status: 'PARTIALLY_PAID' });

    await service.tryInboundClassicAfterClientPayment({
      orderId: 'ord1',
      paymentId: 'pay-dep',
      invoiceId: 'inv-dep',
    });

    expect(prisma.partnerAccrual.create).not.toHaveBeenCalled();
    expect(operationalJournal.appendPartnerAccrualLine).not.toHaveBeenCalled();
  });

  it('creates accrual when received money covers the contract and delivery is DONE', async () => {
    mockClassicFlow();

    await service.tryInboundClassicAfterClientPayment({
      orderId: 'ord1',
      paymentId: 'pay-full',
      invoiceId: 'inv-full',
    });

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: 'pay-full',
          invoiceId: 'inv-full',
          orderId: 'ord1',
          baseAmount: new Decimal('150000'),
          amount: new Decimal('15000.00'),
          status: 'ELIGIBLE',
        }),
      }),
    );
    expect(operationalJournal.appendPartnerAccrualLine).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerAccrualId: 'pa-classic',
        amount: 15000,
        partnerId: 'p1',
        orderId: 'ord1',
      }),
    );
  });

  it('does not create accrual when the order is FULLY_PAID but delivery is not DONE', async () => {
    mockClassicFlow({ product: { status: 'TRANSFER' } });

    await service.tryInboundClassicAfterClientPayment({
      orderId: 'ord1',
      paymentId: 'pay-full',
      invoiceId: 'inv-full',
    });

    expect(prisma.partnerAccrual.create).not.toHaveBeenCalled();
  });

  it('creates accrual after delivery when the order is fully paid and DONE', async () => {
    mockClassicFlow();
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-full', invoiceId: 'inv-full' });

    await service.tryInboundClassicAfterDelivery('ord1');

    expect(prisma.partnerAccrual.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: 'pay-full',
          orderId: 'ord1',
          status: 'ELIGIBLE',
        }),
      }),
    );
  });

  it('does not create a second classic accrual when after-delivery runs twice', async () => {
    mockClassicFlow();
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-full', invoiceId: 'inv-full' });

    await service.tryInboundClassicAfterDelivery('ord1');
    expect(prisma.partnerAccrual.create).toHaveBeenCalledTimes(1);

    prisma.partnerAccrual.findUnique.mockResolvedValue({ id: 'pa-classic' });
    await service.tryInboundClassicAfterDelivery('ord1');

    expect(prisma.partnerAccrual.create).toHaveBeenCalledTimes(1);
  });

  it('does not create a second classic accrual when the order already has a classic row', async () => {
    mockClassicFlow();
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-full', invoiceId: 'inv-full' });
    prisma.partnerAccrual.findFirst.mockResolvedValue({ id: 'pa-existing' });

    await service.tryInboundClassicAfterDelivery('ord1');

    expect(prisma.partnerAccrual.create).not.toHaveBeenCalled();
  });

  it('does not create a classic inbound accrual for a SUBSCRIPTION delivery', async () => {
    mockClassicFlow({ paymentType: 'SUBSCRIPTION' });
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-sub', invoiceId: 'inv-sub' });

    await service.tryInboundClassicAfterDelivery('ord1');

    expect(prisma.partnerAccrual.create).not.toHaveBeenCalled();
    expect(operationalJournal.appendPartnerAccrualLine).not.toHaveBeenCalled();
  });
});
