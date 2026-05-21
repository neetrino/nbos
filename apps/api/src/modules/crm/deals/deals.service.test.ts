import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';
import { createMockPrisma, type MockPrisma } from '../../../test-utils/mock-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuditService } from '../../audit/audit.service';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: MockPrisma;
  let wonHandler: { handle: ReturnType<typeof vi.fn> };
  let auditService: Pick<AuditService, 'log'>;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.fileLink.count.mockResolvedValue(1);
    wonHandler = { handle: vi.fn().mockResolvedValue(undefined) };
    auditService = { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) };
    service = new DealsService(
      prisma as never,
      wonHandler as unknown as DealWonHandler,
      auditService as never,
    );
  });

  const attribution = {
    source: 'SALES',
    sourceDetail: 'COLD_CALL',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
  };

  describe('findAll', () => {
    it('returns paginated result', async () => {
      const result = await service.findAll({});
      expect(result.items).toEqual([]);
      expect(result.meta.page).toBe(1);
    });

    it('applies status and type filters', async () => {
      await service.findAll({ status: 'DISCUSS_NEEDS', type: 'NEW_PROJECT' });
      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DISCUSS_NEEDS',
            type: 'NEW_PROJECT',
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns deal when found', async () => {
      prisma.deal.findUnique.mockResolvedValue({ id: '1', code: 'D-2026-0001' });
      const result = await service.findById('1');
      expect(result.code).toBe('D-2026-0001');
    });

    it('returns linked orders and invoices for CRM chain inspection', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        code: 'D-2026-0001',
        status: 'NEGOTIATION',
        orders: [
          {
            id: 'ord-1',
            code: 'ORD-2026-0001',
            status: 'ACTIVE',
            invoices: [
              {
                id: 'inv-1',
                code: 'INV-2026-0001',
                moneyStatus: 'NEW',
                amount: 5000,
                paidDate: null,
                payments: [{ id: 'pay-1', amount: 2000, paymentDate: new Date('2026-04-20') }],
              },
            ],
          },
        ],
      });

      const result = await service.findById('1');

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]).toMatchObject({
        id: 'ord-1',
        code: 'ORD-2026-0001',
        invoices: [
          {
            id: 'inv-1',
            code: 'INV-2026-0001',
            moneyStatus: 'NEW',
          },
        ],
      });
      expect(prisma.deal.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            orders: expect.objectContaining({
              include: expect.objectContaining({
                invoices: expect.any(Object),
              }),
            }),
          }),
        }),
      );
    });

    it('adds handoff references for won deal downstream visibility', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        code: 'D-2026-0001',
        type: 'PRODUCT',
        status: 'WON',
        projectId: 'project-1',
        existingProduct: null,
      });
      prisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        code: 'P-2026-0001',
        name: 'Acme Website',
        products: [
          {
            id: 'product-1',
            name: 'Acme Website',
            productType: 'COMPANY_WEBSITE',
            status: 'NEW',
          },
        ],
        subscriptions: [
          {
            id: 'sub-1',
            code: 'SUB-2026-0001',
            type: 'DEV_AND_MAINTENANCE',
            status: 'ACTIVE',
            amount: 5000,
          },
        ],
      });
      prisma.deal.findFirst.mockResolvedValue({
        id: 'maint-1',
        code: 'D-2026-0002',
        name: 'Maintenance - Acme Website',
        status: 'START_CONVERSATION',
        amount: 5000,
        maintenanceStartAt: new Date('2026-05-01T00:00:00.000Z'),
      });

      const result = await service.findById('deal-1');

      expect(result.handoff).toMatchObject({
        project: { id: 'project-1', code: 'P-2026-0001', name: 'Acme Website' },
        product: { id: 'product-1', name: 'Acme Website' },
        subscriptions: [{ id: 'sub-1', code: 'SUB-2026-0001' }],
        maintenanceDeal: { id: 'maint-1', code: 'D-2026-0002' },
      });
    });

    it('throws NotFoundException when not found', async () => {
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      prisma.employee.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id }),
      );
    });

    it('generates code and creates direct deal with audit', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });
      prisma.deal.findFirst.mockResolvedValue(null);
      prisma.deal.create.mockResolvedValue({
        id: '1',
        code: 'D-2026-0001',
        projectId: null,
        type: 'PRODUCT',
        source: 'SALES',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        code: 'D-2026-0001',
        projectId: null,
        type: 'PRODUCT',
        source: 'SALES',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });

      const result = await service.create(
        {
          contactId: 'c-1',
          type: 'PRODUCT',
          paymentType: 'CLASSIC',
          sellerId: 's-1',
          name: 'Direct client',
          source: 'SALES',
          sourceDetail: 'COLD_CALL',
        },
        { actorId: 'user-1' },
      );

      expect(result.code).toBe('D-2026-0001');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'DEAL',
          action: 'DEAL_CREATED',
          userId: 'user-1',
          changes: expect.objectContaining({ withoutPriorLead: true }),
        }),
      );
    });

    it('allows minimal payload when leadId is present', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });
      prisma.deal.findFirst.mockResolvedValue(null);
      prisma.deal.create.mockResolvedValue({
        id: '1',
        code: 'D-2026-0002',
        projectId: null,
        type: 'PRODUCT',
        source: 'SALES',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        code: 'D-2026-0002',
        projectId: null,
        type: 'PRODUCT',
        source: 'SALES',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });

      await service.create(
        {
          leadId: 'lead-1',
          contactId: 'c-1',
          type: 'PRODUCT',
          paymentType: 'CLASSIC',
          sellerId: 's-1',
        },
        { actorId: 'user-1' },
      );

      expect(prisma.deal.create).toHaveBeenCalled();
    });

    it('rejects direct deal without attribution', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });
      await expect(
        service.create({
          contactId: 'c-1',
          type: 'PRODUCT',
          paymentType: 'CLASSIC',
          sellerId: 's-1',
          name: 'Needs attribution',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('skips DEAL_CREATED audit when actorId is omitted', async () => {
      prisma.contact.findUnique.mockResolvedValue({ id: 'c-1' });
      prisma.deal.findFirst.mockResolvedValue(null);
      prisma.deal.create.mockResolvedValue({
        id: '1',
        code: 'D-2026-0003',
        projectId: null,
        type: 'PRODUCT',
        source: 'CLIENT',
        sourceDetail: 'OTHER',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        code: 'D-2026-0003',
        projectId: null,
        type: 'PRODUCT',
        source: 'CLIENT',
        sourceDetail: 'OTHER',
        sourcePartnerId: null,
        paymentType: 'CLASSIC',
      });
      vi.mocked(auditService.log).mockClear();

      await service.create({
        contactId: 'c-1',
        type: 'PRODUCT',
        paymentType: 'CLASSIC',
        sellerId: 's-1',
        name: 'No audit actor',
        source: 'CLIENT',
        sourceDetail: 'OTHER',
      });

      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates deal on locked stage when attribution unchanged', async () => {
      let calls = 0;
      prisma.deal.findUnique.mockImplementation(() => {
        calls += 1;
        const base = {
          id: '1',
          status: 'DISCUSS_NEEDS',
          type: 'EXTENSION',
          projectId: null,
          existingProduct: null,
          ...attribution,
        };
        if (calls === 1) {
          return Promise.resolve({ ...base, name: 'Old' });
        }
        return Promise.resolve({ ...base, name: 'New' });
      });
      prisma.deal.update.mockResolvedValue({ id: '1', name: 'New', status: 'DISCUSS_NEEDS' });

      const result = await service.update('1', { name: 'New' });
      expect(result.name).toBe('New');
    });

    it('rejects clearing source when deal attribution is locked', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        status: 'DISCUSS_NEEDS',
        type: 'EXTENSION',
        projectId: null,
        existingProduct: null,
        ...attribution,
      });

      await expect(service.update('1', { source: null })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof BadRequestException &&
          (err.getResponse() as { code?: string }).code === 'ATTRIBUTION_IMMUTABLE',
      );
      expect(prisma.deal.update).not.toHaveBeenCalled();
    });

    it('allows clearing source on START_CONVERSATION', async () => {
      let calls = 0;
      prisma.deal.findUnique.mockImplementation(() => {
        calls += 1;
        const base = {
          id: '1',
          status: 'START_CONVERSATION',
          type: 'EXTENSION',
          projectId: null,
          existingProduct: null,
          ...attribution,
        };
        if (calls === 1) return Promise.resolve(base);
        return Promise.resolve({
          ...base,
          source: null,
          sourceDetail: null,
        });
      });
      prisma.deal.update.mockResolvedValue({
        id: '1',
        status: 'START_CONVERSATION',
        source: null,
        sourceDetail: null,
      });

      const result = await service.update('1', { source: null, sourceDetail: null });
      expect(result.source).toBeNull();
    });

    it('persists sellerAssistantId when employee exists', async () => {
      prisma.employee.findUnique.mockImplementation(({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id }),
      );
      let assistantCalls = 0;
      prisma.deal.findUnique.mockImplementation(() => {
        assistantCalls += 1;
        return Promise.resolve({
          id: '1',
          status: 'START_CONVERSATION',
          type: 'PRODUCT',
          sellerId: 's-1',
          sellerAssistantId: assistantCalls === 1 ? null : 'asst-1',
          projectId: null,
          existingProduct: null,
          ...attribution,
        });
      });
      prisma.deal.update.mockResolvedValue({ id: '1', sellerAssistantId: 'asst-1' });

      await service.update('1', { sellerAssistantId: 'asst-1' });

      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sellerAssistantId: 'asst-1' }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('returns current deal when status is unchanged', async () => {
      const currentDeal = {
        id: '1',
        status: 'WON',
        type: 'PRODUCT',
        amount: 5000,
        paymentType: 'CLASSIC',
        taxStatus: 'TAX',
        companyId: 'company-1',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        pmId: 'pm-1',
        deadline: new Date(),
        existingProductId: null,
        offerSentAt: new Date(),
        offerLink: 'https://example.com/offer',
        offerFileUrl: null,
        offerScreenshotUrl: null,
        contractSignedAt: new Date(),
        contractFileUrl: null,
        ...attribution,
      };

      prisma.deal.findUnique.mockResolvedValue(currentDeal);

      const result = await service.updateStatus('1', 'WON');

      expect(result).toMatchObject(currentDeal);
      expect(result.handoff).toEqual({
        project: null,
        product: null,
        subscriptions: [],
        maintenanceDeal: null,
      });
      expect(prisma.deal.update).not.toHaveBeenCalled();
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });

    it('blocks moving a won deal back to an active stage', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        status: 'WON',
        type: 'PRODUCT',
        amount: 5000,
        paymentType: 'CLASSIC',
        taxStatus: 'TAX',
        companyId: 'company-1',
        productCategory: 'CODE',
        productType: 'COMPANY_WEBSITE',
        pmId: 'pm-1',
        deadline: new Date(),
        existingProductId: null,
        offerSentAt: new Date(),
        offerLink: 'https://example.com/offer',
        offerFileUrl: null,
        offerScreenshotUrl: null,
        contractSignedAt: new Date(),
        contractFileUrl: null,
        ...attribution,
      });

      await expect(service.updateStatus('1', 'DISCUSS_NEEDS')).rejects.toMatchObject({
        response: {
          code: 'BUSINESS_TRANSITION_UNAVAILABLE',
        },
      });
      expect(prisma.deal.update).not.toHaveBeenCalled();
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });

    it('updates deal status for early stage (no gate)', async () => {
      const before = {
        id: '1',
        status: 'START_CONVERSATION',
        type: 'PRODUCT',
        amount: null,
        paymentType: null,
        taxStatus: 'TAX',
        companyId: null,
        productCategory: null,
        productType: null,
        pmId: null,
        deadline: null,
        existingProductId: null,
        offerSentAt: null,
        offerLink: null,
        offerFileUrl: null,
        offerScreenshotUrl: null,
        contractSignedAt: null,
        contractFileUrl: null,
        ...attribution,
      };
      const after = { ...before, status: 'DISCUSS_NEEDS' };
      prisma.deal.findUnique
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(before)
        .mockResolvedValueOnce(after);
      prisma.deal.update.mockResolvedValue({ id: '1', status: 'DISCUSS_NEEDS' });
      const result = await service.updateStatus('1', 'DISCUSS_NEEDS');
      expect(result.status).toBe('DISCUSS_NEEDS');
    });

    it('blocks WON when required fields missing', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        id: '1',
        type: 'PRODUCT',
        amount: null,
        paymentType: null,
        taxStatus: 'TAX',
        companyId: null,
        productCategory: null,
        productType: null,
        pmId: null,
        deadline: null,
        existingProductId: null,
        offerSentAt: null,
        offerLink: null,
        offerFileUrl: null,
        offerScreenshotUrl: null,
        contractSignedAt: null,
        contractFileUrl: null,
        ...attribution,
      });
      await expect(service.updateStatus('1', 'WON')).rejects.toThrow('missing required fields');
    });

    it('allows WON when all required fields present', async () => {
      const base = completeProductDeal();
      const won = { ...base, status: 'WON' as const };
      prisma.deal.findUnique
        .mockResolvedValueOnce(base)
        .mockResolvedValueOnce(base)
        .mockResolvedValueOnce(won)
        .mockResolvedValueOnce(won);
      prisma.deal.update.mockResolvedValue({
        id: '1',
        status: 'WON',
        type: 'PRODUCT',
      });
      const result = await service.updateStatus('1', 'WON');
      expect(result.status).toBe('WON');
      expect(wonHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('blocks WON when no invoice is linked', async () => {
      prisma.deal.findUnique.mockResolvedValue({ ...completeProductDeal(), orders: [] });

      await expect(service.updateStatus('1', 'WON')).rejects.toMatchObject({
        response: {
          code: 'STAGE_GATE_VALIDATION',
          errors: [{ field: 'invoice', message: expect.any(String) }],
        },
      });
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });

    it('blocks WON when first invoice is unpaid', async () => {
      prisma.deal.findUnique.mockResolvedValue(completeProductDeal('AWAITING_PAYMENT'));

      await expect(service.updateStatus('1', 'WON')).rejects.toMatchObject({
        response: {
          code: 'STAGE_GATE_VALIDATION',
          errors: [{ field: 'payment', message: expect.any(String) }],
        },
      });
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });

    it('allows MAINTENANCE WON without deposit invoice in this foundation slice', async () => {
      const maintenanceDeal = {
        ...completeProductDeal(),
        type: 'MAINTENANCE',
        paymentType: 'SUBSCRIPTION',
        productCategory: null,
        productType: null,
        pmId: null,
        deadline: null,
        orders: [],
      };
      const wonMaintenance = { ...maintenanceDeal, status: 'WON' as const };
      prisma.deal.findUnique
        .mockResolvedValueOnce(maintenanceDeal)
        .mockResolvedValueOnce(maintenanceDeal)
        .mockResolvedValueOnce(wonMaintenance)
        .mockResolvedValueOnce(wonMaintenance);
      prisma.deal.update.mockResolvedValue({ id: '1', status: 'WON', type: 'MAINTENANCE' });

      const result = await service.updateStatus('1', 'WON');

      expect(result.status).toBe('WON');
      expect(wonHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('allows Owner or CEO override without marking invoices paid', async () => {
      const base = completeProductDeal('AWAITING_PAYMENT');
      const won = { ...base, status: 'WON' as const };
      prisma.deal.findUnique
        .mockResolvedValueOnce(base)
        .mockResolvedValueOnce(base)
        .mockResolvedValueOnce(won)
        .mockResolvedValueOnce(won);
      prisma.deal.update.mockResolvedValue({ id: '1', status: 'WON', type: 'PRODUCT' });

      await service.updateStatus('1', 'WON', {
        reason: 'Client confirmed transfer; Finance will reconcile later.',
        actorId: 'ceo-1',
        actorRoleLevel: 2,
      });

      expect(prisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'WON',
            notes: expect.stringContaining('Deal Won override reason'),
          }),
        }),
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DEAL_WON_OVERRIDE',
          userId: 'ceo-1',
        }),
      );
      expect(wonHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('rejects non-privileged override', async () => {
      prisma.deal.findUnique.mockResolvedValue(completeProductDeal('AWAITING_PAYMENT'));

      await expect(
        service.updateStatus('1', 'WON', {
          reason: 'Seller override attempt',
          actorId: 'seller-1',
          actorRoleLevel: 4,
        }),
      ).rejects.toThrow('Only Owner or CEO can override');
      expect(wonHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns stats', async () => {
      prisma.deal.count.mockResolvedValue(10);
      const stats = await service.getStats();
      expect(stats.total).toBe(10);
    });
  });
});

function completeProductDeal(invoiceMoneyStatus: 'PAID' | 'AWAITING_PAYMENT' = 'PAID') {
  return {
    id: '1',
    status: 'DEPOSIT_AND_CONTRACT',
    type: 'PRODUCT',
    amount: 5000,
    paymentType: 'CLASSIC',
    taxStatus: 'TAX',
    companyId: 'company-1',
    productCategory: 'CODE',
    productType: 'COMPANY_WEBSITE',
    pmId: 'pm-1',
    deadline: new Date(),
    existingProductId: null,
    offerSentAt: new Date(),
    offerLink: 'https://example.com/offer',
    offerFileUrl: null,
    offerScreenshotUrl: null,
    contractSignedAt: new Date(),
    contractFileUrl: null,
    notes: null,
    source: 'SALES',
    sourceDetail: 'COLD_CALL',
    sourcePartnerId: null,
    sourceContactId: null,
    marketingAccountId: null,
    marketingActivityId: null,
    orders: [
      {
        id: 'order-1',
        invoices: [
          { id: 'invoice-1', moneyStatus: invoiceMoneyStatus, amount: 5000, payments: [] },
        ],
      },
    ],
  };
}
