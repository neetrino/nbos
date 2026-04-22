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

    await handler.handle({
      id: 'deal-1',
      code: 'D-2026-0001',
      name: 'Website build',
      type: 'PRODUCT',
      contactId: 'contact-1',
      companyId: 'company-1',
      sellerId: 'seller-1',
      projectId: null,
      productCategory: 'CODE',
      productType: 'COMPANY_WEBSITE',
      pmId: 'pm-1',
      deadline: new Date('2026-06-01'),
      existingProductId: null,
    });

    expect(prisma.project.create).toHaveBeenCalledTimes(1);
    expect(prisma.deal.update).toHaveBeenCalledWith({
      where: { id: 'deal-1' },
      data: { projectId: 'proj-1' },
    });
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('creates extension and links project for EXTENSION deal', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', projectId: 'proj-42' });
    prisma.extension.create.mockResolvedValue({ id: 'ext-1' });

    await handler.handle({
      id: 'deal-2',
      code: 'D-2026-0002',
      name: 'Extra module',
      type: 'EXTENSION',
      contactId: 'contact-1',
      companyId: null,
      sellerId: 'seller-1',
      projectId: null,
      productCategory: null,
      productType: null,
      pmId: null,
      deadline: null,
      existingProductId: 'prod-1',
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
      contactId: 'contact-1',
      companyId: null,
      sellerId: 'seller-1',
      projectId: null,
      productCategory: null,
      productType: null,
      pmId: null,
      deadline: null,
      existingProductId: 'missing-product',
    });

    expect(prisma.extension.create).not.toHaveBeenCalled();
    expect(prisma.deal.update).not.toHaveBeenCalled();
  });
});
