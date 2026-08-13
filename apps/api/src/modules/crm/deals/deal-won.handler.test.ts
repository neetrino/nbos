import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decimal } from '@nbos/database';
import { DealWonHandler } from './deal-won.handler';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

function makeDriveDealWonLinksMock() {
  return { linkApprovedDealMaterials: vi.fn().mockResolvedValue(0) };
}

function makeProductTeamSyncMock() {
  return {
    syncProductSlots: vi.fn().mockResolvedValue(undefined),
    syncProductSeller: vi.fn().mockResolvedValue(undefined),
  };
}

function makeProductWhatsAppMock() {
  return {
    ensureGroupForProduct: vi.fn().mockResolvedValue({}),
  };
}

describe('DealWonHandler', () => {
  let prisma: MockPrisma;
  let handler: DealWonHandler;
  let driveDealWonLinks: ReturnType<typeof makeDriveDealWonLinksMock>;
  let productTeamSync: ReturnType<typeof makeProductTeamSyncMock>;
  let productWhatsApp: ReturnType<typeof makeProductWhatsAppMock>;

  beforeEach(() => {
    prisma = createMockPrisma();
    driveDealWonLinks = makeDriveDealWonLinksMock();
    productTeamSync = makeProductTeamSyncMock();
    productWhatsApp = makeProductWhatsAppMock();
    handler = new DealWonHandler(
      prisma as never,
      driveDealWonLinks as never,
      productTeamSync as never,
      productWhatsApp as never,
    );
  });

  it('creates project and product for PRODUCT deal without project', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    prisma.project.create.mockResolvedValue({ id: 'proj-1', code: 'P-2026-0001' });
    prisma.product.create.mockResolvedValue({ id: 'product-1' });

    await handler.handle(
      productDeal({
        projectId: null,
      }),
    );

    expect(prisma.project.create).toHaveBeenCalledTimes(1);
    expect(prisma.deal.update).toHaveBeenCalledWith({
      where: { id: 'deal-1' },
      data: { projectId: 'proj-1' },
    });
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('copies deal additional contacts onto auto-created project', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    prisma.project.create.mockResolvedValue({ id: 'proj-1', code: 'P-2026-0001' });
    prisma.dealAdditionalContact.findMany.mockResolvedValue([{ contactId: 'c-extra' }]);
    prisma.contact.count.mockResolvedValue(1);
    prisma.product.create.mockResolvedValue({ id: 'product-1' });

    await handler.handle(productDeal({ projectId: null }));

    expect(prisma.projectAdditionalContact.createMany).toHaveBeenCalledWith({
      data: [{ projectId: 'proj-1', contactId: 'c-extra' }],
      skipDuplicates: true,
    });
  });

  it('creates active subscription for PRODUCT subscription deal after paid invoice', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });

    await handler.handle(productDeal({ paymentType: 'SUBSCRIPTION' }));

    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'product-1', type: 'DEV_AND_MAINTENANCE' },
      }),
    );
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          productId: 'product-1',
          type: 'DEV_AND_MAINTENANCE',
          status: 'ACTIVE',
          amount: 5000,
          billingFrequency: 'MONTHLY',
          coverageMonthCount: 1,
          taxStatus: 'TAX',
        }),
      }),
    );
    expect(prisma.subscription.create.mock.calls[0]?.[0]?.data).not.toHaveProperty('termMonths');
  });

  it('creates DEV_ONLY term subscription with deal amount copied as-is', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-term' });

    await handler.handle(
      productDeal({
        paymentType: 'SUBSCRIPTION',
        amount: 1_000_000,
        subscriptionTermMonths: 6,
      }),
    );

    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'product-1', type: 'DEV_ONLY' },
      }),
    );
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          productId: 'product-1',
          type: 'DEV_ONLY',
          status: 'ACTIVE',
          amount: 1_000_000,
          billingFrequency: 'MONTHLY',
          coverageMonthCount: 1,
          termMonths: 6,
          taxStatus: 'TAX',
        }),
      }),
    );
  });

  it('re-syncs order contract total when subscription term changed before won', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      totalAmount: 6_000_000,
      subscriptionTermMonths: 6,
    });
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-term' });

    await handler.handle(
      productDeal({
        paymentType: 'SUBSCRIPTION',
        amount: 1_000_000,
        subscriptionTermMonths: 12,
      }),
    );

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: {
        totalAmount: 12_000_000,
        subscriptionTermMonths: 12,
      },
    });
  });

  it('does not update order when contract total already matches deal at won', async () => {
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      totalAmount: 6_000_000,
      subscriptionTermMonths: 6,
    });
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-term' });

    await handler.handle(
      productDeal({
        paymentType: 'SUBSCRIPTION',
        amount: 1_000_000,
        subscriptionTermMonths: 6,
      }),
    );

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('does not re-sync order for CLASSIC deals at won', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });

    await handler.handle(productDeal({ paymentType: 'CLASSIC' }));

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('does not re-sync order for open-ended SUBSCRIPTION deals at won', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-open' });

    await handler.handle(
      productDeal({
        paymentType: 'SUBSCRIPTION',
        subscriptionTermMonths: null,
      }),
    );

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('auto-creates linked MAINTENANCE deal after PRODUCT won', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.deal.findFirst.mockResolvedValue(null);
    prisma.deal.create.mockResolvedValue({ id: 'maintenance-deal-1' });

    await handler.handle(productDeal());

    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'MAINTENANCE',
          paymentType: 'SUBSCRIPTION',
          projectId: 'proj-1',
          existingProductId: 'product-1',
          source: 'SALES',
          sourceDetail: 'COLD_CALL',
        }),
      }),
    );
  });

  it('does not duplicate maintenance deal when one already exists', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.deal.findFirst.mockResolvedValue({ id: 'maintenance-deal-1' });

    await handler.handle(productDeal());

    expect(prisma.deal.create).not.toHaveBeenCalled();
  });

  it('creates extension and links project for EXTENSION deal', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-42' });
    prisma.extension.create.mockResolvedValue({ id: 'ext-1' });

    await handler.handle({
      id: 'deal-2',
      code: 'D-2026-0002',
      name: 'Extra module',
      type: 'EXTENSION',
      amount: 1000,
      paymentType: 'CLASSIC',
      taxStatus: 'TAX',
      contactId: 'contact-1',
      companyId: null,
      sellerId: 'seller-1',
      projectId: null,
      productCategory: null,
      productType: null,
      pmId: null,
      deadline: null,
      existingProductId: 'prod-1',
      maintenanceStartAt: null,
      source: 'SALES',
      sourceDetail: 'COLD_CALL',
      sourcePartnerId: null,
      sourceContactId: null,
      marketingAccountId: null,
      marketingActivityId: null,
    });

    expect(prisma.extension.create).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-42',
        productId: 'prod-1',
        name: 'Extra module',
        size: 'MEDIUM',
      },
    });
    expect(prisma.deal.update).toHaveBeenCalledWith({
      where: { id: 'deal-2' },
      data: { projectId: 'proj-42' },
    });
  });

  it('skips extension creation when existing product is missing', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await handler.handle({
      id: 'deal-3',
      code: 'D-2026-0003',
      name: 'Broken extension',
      type: 'EXTENSION',
      amount: 1000,
      paymentType: 'CLASSIC',
      taxStatus: 'TAX',
      contactId: 'contact-1',
      companyId: null,
      sellerId: 'seller-1',
      projectId: null,
      productCategory: null,
      productType: null,
      pmId: null,
      deadline: null,
      existingProductId: 'missing-product',
      maintenanceStartAt: null,
      source: 'SALES',
      sourceDetail: 'COLD_CALL',
      sourcePartnerId: null,
      sourceContactId: null,
      marketingAccountId: null,
      marketingActivityId: null,
    });

    expect(prisma.extension.create).not.toHaveBeenCalled();
    expect(prisma.deal.update).not.toHaveBeenCalled();
  });

  it('creates pending maintenance subscription for MAINTENANCE deal', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-maint', projectId: 'proj-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });

    await handler.handle({
      ...productDeal({
        type: 'MAINTENANCE',
        amount: 80000,
        projectId: 'proj-1',
        productCategory: null,
        productType: null,
        existingProductId: 'prod-maint',
        maintenanceStartAt: new Date('2026-05-15'),
      }),
    });

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          productId: 'prod-maint',
          type: 'MAINTENANCE_ONLY',
          status: 'PENDING',
          amount: 80000,
          billingFrequency: 'MONTHLY',
          coverageMonthCount: 1,
          billingDay: 15,
          taxStatus: 'TAX',
        }),
      }),
    );
  });

  it('does not create maintenance subscription without existingProductId', async () => {
    await handler.handle({
      ...productDeal({
        type: 'MAINTENANCE',
        amount: 80000,
        projectId: 'proj-1',
        productCategory: null,
        productType: null,
        existingProductId: null,
      }),
    });

    expect(prisma.subscription.create).not.toHaveBeenCalled();
  });

  it('creates outsource product without active delivery board when toggle is OFF', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-out' });

    await handler.handle(
      productDeal({
        type: 'OUTSOURCE',
        outsourceGoesToDelivery: false,
      }),
    );

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DONE',
          deliveryStage: null,
          deliveryResolution: 'DONE',
        }),
      }),
    );
    expect(productWhatsApp.ensureGroupForProduct).toHaveBeenCalledWith(
      'product-out',
      expect.objectContaining({ source: 'DEAL_WON' }),
    );
  });

  it('creates outsource product on active delivery board when toggle is ON', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-out-on' });

    await handler.handle(
      productDeal({
        type: 'OUTSOURCE',
        outsourceGoesToDelivery: true,
      }),
    );

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          deliveryResolution: 'DONE',
        }),
      }),
    );
  });

  describe('Route A deposit coverage linkage', () => {
    const paidAt = new Date(2026, 2, 15);

    function paidDepositInvoice(overrides: Record<string, unknown> = {}) {
      return {
        id: 'inv-deposit',
        moneyStatus: 'PAID',
        amount: 1_000_000,
        paidDate: paidAt,
        subscriptionId: null,
        ...overrides,
      };
    }

    function subscriptionDeal(overrides: Record<string, unknown> = {}) {
      return productDeal({
        paymentType: 'SUBSCRIPTION',
        amount: 1_000_000,
        subscriptionTermMonths: 6,
        orders: [{ invoices: [paidDepositInvoice()] }],
        ...overrides,
      });
    }

    function mockCreatedSubscription() {
      prisma.product.create.mockResolvedValue({ id: 'product-1' });
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });
    }

    function mockDbInvoice(overrides: Record<string, unknown> = {}) {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-deposit',
        code: 'INV-2026-0001',
        amount: new Decimal('1000000.00'),
        paidDate: paidAt,
        subscriptionId: null,
        type: 'SUBSCRIPTION',
        order: { dealId: 'deal-1' },
        ...overrides,
      });
    }

    it('links a deposit equal to the period price as the paid month with one period of coverage', async () => {
      mockCreatedSubscription();
      mockDbInvoice();

      await handler.handle(subscriptionDeal());

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-deposit' },
        data: {
          subscriptionId: 'sub-1',
          coverageStartMonth: '2026-03',
          coverageMonthCount: 1,
        },
      });
    });

    it('links a deposit equal to exactly two period prices as two coverage months', async () => {
      mockCreatedSubscription();
      mockDbInvoice({ amount: new Decimal('2000000.00') });

      await handler.handle(
        subscriptionDeal({
          orders: [{ invoices: [paidDepositInvoice({ amount: 2_000_000 })] }],
        }),
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-deposit' },
        data: {
          subscriptionId: 'sub-1',
          coverageStartMonth: '2026-03',
          coverageMonthCount: 2,
        },
      });
    });

    it('leaves a partial deposit unlinked, writes nothing else, and logs a warning', async () => {
      mockCreatedSubscription();
      mockDbInvoice({ amount: new Decimal('400000.00') });
      const warnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await handler.handle(
        subscriptionDeal({
          orders: [{ invoices: [paidDepositInvoice({ amount: 400_000 })] }],
        }),
      );

      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(prisma.subscription.create).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('D-2026-0001'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('INV-2026-0001'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('400000.00'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('1000000.00'));
      warnSpy.mockRestore();
    });

    it('never re-links an invoice that already carries a subscriptionId', async () => {
      mockCreatedSubscription();
      mockDbInvoice({ subscriptionId: 'sub-other' });

      await handler.handle(
        subscriptionDeal({
          orders: [{ invoices: [paidDepositInvoice({ subscriptionId: 'sub-other' })] }],
        }),
      );

      expect(prisma.subscription.create).toHaveBeenCalledTimes(1);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('links nothing when the subscription already exists (idempotency early return)', async () => {
      prisma.product.create.mockResolvedValue({ id: 'product-1' });
      prisma.subscription.findFirst.mockResolvedValue({ id: 'sub-existing' });

      await handler.handle(subscriptionDeal());

      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.invoice.findUnique).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });
});

function productDeal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal-1',
    code: 'D-2026-0001',
    name: 'Website build',
    type: 'PRODUCT',
    amount: 5000,
    paymentType: 'CLASSIC',
    taxStatus: 'TAX',
    contactId: 'contact-1',
    companyId: 'company-1',
    sellerId: 'seller-1',
    projectId: 'proj-1',
    productCategory: 'CODE',
    productType: 'COMPANY_WEBSITE',
    pmId: 'pm-1',
    deadline: new Date('2026-06-01'),
    existingProductId: null,
    maintenanceStartAt: null,
    source: 'SALES',
    sourceDetail: 'COLD_CALL',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
    orders: [
      {
        invoices: [
          {
            moneyStatus: 'PAID',
            amount: 5000,
            paidDate: new Date('2026-04-15'),
          },
        ],
      },
    ],
    ...overrides,
  };
}
