import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
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

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
  });

  describe('findById', () => {
    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns product when found', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'CREATING',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'HOSTING' }],
          domains: [{ status: 'ACTIVE' }],
          _count: { credentials: 1, domains: 1 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: {
            offerFileUrl: 'https://cdn.example.com/offer.pdf',
            contractFileUrl: 'https://cdn.example.com/contract.pdf',
          },
          invoices: [{ moneyStatus: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });
      const result = await service.findById('p1');
      expect(result.name).toBe('Test');
      expect(result.deliveryLifecycle).toMatchObject({
        stage: 'STARTING',
        workStatus: 'ACTIVE',
      });
      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: true,
        blockers: [],
        warnings: [],
        missingRuntimeSignals: [{ code: 'DELIVERY_FILE_LINK_RUNTIME_MISSING' }],
        summary: {
          approvedOfferFilePresent: true,
          clientAccepted: true,
          contractFilePresent: true,
          handoffCredentialCount: 1,
        },
      });
    });

    it('returns workSpaceId when product has a Work Space', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'CREATING',
        clientAcceptedAt: null,
        project: {
          credentials: [],
          domains: [],
          _count: { credentials: 0, domains: 0 },
        },
        order: null,
        extensions: [],
        tasks: [],
        tickets: [],
        workSpace: { id: 'ws-1' },
      });
      const result = await service.findById('p1');
      expect(result.workSpaceId).toBe('ws-1');
    });

    it('returns null workSpaceId when product has no Work Space', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'CREATING',
        clientAcceptedAt: null,
        project: {
          credentials: [],
          domains: [],
          _count: { credentials: 0, domains: 0 },
        },
        order: null,
        extensions: [],
        tasks: [],
        tickets: [],
        workSpace: null,
      });
      const result = await service.findById('p1');
      expect(result.workSpaceId).toBeNull();
    });

    it('surfaces Done readiness blockers and missing documentation', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        project: { credentials: [], domains: [], _count: { credentials: 0, domains: 0 } },
        order: {
          status: 'PARTIALLY_PAID',
          deal: null,
          invoices: [{ moneyStatus: 'AWAITING_PAYMENT' }],
        },
        extensions: [{ status: 'DEVELOPMENT' }],
        tasks: [{ status: 'IN_PROGRESS' }],
        tickets: [{ status: 'NEW' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: false,
        summary: {
          credentialCount: 0,
          approvedOfferFilePresent: false,
          clientAccepted: false,
          contractFilePresent: false,
          deliveryFileRuntimeAvailable: false,
          domainCount: 0,
          expiredDomainCount: 0,
          expiringDomainCount: 0,
          handoffCredentialCount: 0,
          openExtensionCount: 1,
          openTaskCount: 1,
          openTicketCount: 1,
          unpaidInvoiceCount: 1,
        },
      });
      expect(result.doneReadiness.blockers.map((item) => item.code)).toEqual(
        expect.arrayContaining([
          'OPEN_EXTENSIONS',
          'OPEN_TASKS',
          'OPEN_TICKETS',
          'CLIENT_ACCEPTANCE_MISSING',
          'UNPAID_INVOICES',
          'ORDER_NOT_CLOSED',
        ]),
      );
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_PROJECT_CREDENTIALS',
        'NO_PROJECT_DOMAINS',
        'NO_APPROVED_OFFER_FILE',
        'NO_CONTRACT_FILE',
      ]);
    });

    it('surfaces handoff credential and domain readiness', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'OTHER' }],
          domains: [{ status: 'EXPIRED' }, { status: 'EXPIRING_SOON' }],
          _count: { credentials: 1, domains: 2 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: {
            offerFileUrl: 'https://cdn.example.com/offer.pdf',
            contractFileUrl: 'https://cdn.example.com/contract.pdf',
          },
          invoices: [{ moneyStatus: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: false,
        summary: {
          expiredDomainCount: 1,
          expiringDomainCount: 1,
          handoffCredentialCount: 0,
        },
      });
      expect(result.doneReadiness.blockers.map((item) => item.code)).toEqual(['EXPIRED_DOMAINS']);
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_HANDOFF_CREDENTIALS',
        'EXPIRING_DOMAINS',
      ]);
    });

    it('surfaces missing Drive handoff files without blocking runtime completion', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Test',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        project: {
          credentials: [{ category: 'HOSTING' }],
          domains: [{ status: 'ACTIVE' }],
          _count: { credentials: 1, domains: 1 },
        },
        order: {
          status: 'FULLY_PAID',
          deal: { offerFileUrl: null, contractFileUrl: null },
          invoices: [{ moneyStatus: 'PAID' }],
        },
        extensions: [{ status: 'DONE' }],
        tasks: [{ status: 'DONE' }],
        tickets: [{ status: 'RESOLVED' }],
      });

      const result = await service.findById('p1');

      expect(result.doneReadiness).toMatchObject({
        canCompleteWithRuntimeData: true,
        summary: {
          approvedOfferFilePresent: false,
          contractFilePresent: false,
          deliveryFileRuntimeAvailable: false,
        },
      });
      expect(result.doneReadiness.warnings.map((item) => item.code)).toEqual([
        'NO_APPROVED_OFFER_FILE',
        'NO_CONTRACT_FILE',
      ]);
      expect(result.doneReadiness.missingRuntimeSignals.map((item) => item.code)).toEqual([
        'DELIVERY_FILE_LINK_RUNTIME_MISSING',
      ]);
    });
  });
});
