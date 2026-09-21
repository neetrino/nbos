import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];
  let productWhatsApp: ProductsServiceHarness['productWhatsApp'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    productWhatsApp = harness.productWhatsApp;
  });

  describe('create', () => {
    it('creates product with required fields', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        contactId: 'contact-1',
        companyId: 'co-1',
        trashedAt: null,
      });
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        contactId: 'contact-1',
        name: 'Website',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
      });
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        contactId: 'contact-1',
        name: 'Website',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        status: 'NEW',
        deliveryStage: 'STARTING',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
        contact: { id: 'contact-1', firstName: 'A', lastName: 'B' },
        additionalContacts: [],
        project: { id: 'proj-1', code: 'P-1', name: 'Proj' },
        pm: null,
        developer: null,
        frontendDeveloper: null,
        designer: null,
        technicalSpecialist: null,
        qaLead: null,
        closedBy: null,
        technicalProfiles: [],
        order: null,
        extensions: [],
        tasks: [],
        tickets: [],
        workSpace: null,
      });
      prisma.order.findFirst.mockResolvedValue(null);
      const result = await service.create({
        projectId: 'proj-1',
        name: 'Website',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
      });
      expect(result.productType).toBe('COMPANY_WEBSITE');
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contactId: 'contact-1',
            companyId: 'co-1',
            productPlatform: 'WEB',
          }),
        }),
      );
      expect(productWhatsApp.ensureGroupForProduct).not.toHaveBeenCalled();
    });

    it('creates product with optional fields', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        contactId: 'contact-1',
        companyId: 'co-1',
        trashedAt: null,
      });
      prisma.product.create.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        contactId: 'contact-1',
        name: 'App',
      });
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        contactId: 'contact-1',
        name: 'App',
        productCategory: 'CODE',
        productType: 'MOBILE_APP',
        status: 'NEW',
        deliveryStage: 'STARTING',
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: null,
        contact: { id: 'contact-1', firstName: 'A', lastName: 'B' },
        additionalContacts: [],
        project: { id: 'proj-1', code: 'P-1', name: 'Proj' },
        pm: null,
        developer: null,
        frontendDeveloper: null,
        designer: null,
        technicalSpecialist: null,
        qaLead: null,
        closedBy: null,
        technicalProfiles: [],
        order: null,
        extensions: [],
        tasks: [],
        tickets: [],
        workSpace: null,
      });
      prisma.order.findFirst.mockResolvedValue(null);
      await service.create({
        projectId: 'proj-1',
        name: 'App',
        productCategory: 'CODE',
        productType: 'MOBILE_APP',
        pmId: 'pm-1',
        deadline: '2026-12-31',
        description: 'Mobile app',
      });
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pmId: 'pm-1',
            description: 'Mobile app',
            contactId: 'contact-1',
            productPlatform: 'APP',
          }),
        }),
      );
    });
  });
});
