import { beforeEach, describe, expect, it } from 'vitest';
import { DealWonHandler } from './deal-won.handler';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';

describe('DealWonHandler', () => {
  let prisma: MockPrisma;
  let handler: DealWonHandler;

  beforeEach(() => {
    prisma = createMockPrisma();
    handler = new DealWonHandler(prisma as never);
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

  it('creates active subscription for PRODUCT subscription deal after paid invoice', async () => {
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });

    await handler.handle(productDeal({ paymentType: 'SUBSCRIPTION' }));

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          type: 'DEV_AND_MAINTENANCE',
          status: 'ACTIVE',
          amount: 5000,
        }),
      }),
    );
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
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({ id: 'sub-1' });

    await handler.handle({
      ...productDeal({
        type: 'MAINTENANCE',
        amount: 80000,
        projectId: 'proj-1',
        productCategory: null,
        productType: null,
        maintenanceStartAt: new Date('2026-05-15'),
      }),
    });

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          type: 'MAINTENANCE_ONLY',
          status: 'PENDING',
          amount: 80000,
          billingDay: 15,
        }),
      }),
    );
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
            status: 'PAID',
            amount: 5000,
            paidDate: new Date('2026-04-15'),
          },
        ],
      },
    ],
    ...overrides,
  };
}
