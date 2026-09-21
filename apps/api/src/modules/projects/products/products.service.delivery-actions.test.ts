import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
  readExceptionResponse,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];
  let notifications: ProductsServiceHarness['notifications'];
  let partnerAccrualClassic: ProductsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ProductsServiceHarness['partnerAccrualSubscription'];
  let auditService: ProductsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    notifications = harness.notifications;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
  });

  describe('dedicated delivery actions', () => {
    it('moves product to a canonical stage through stage-specific action', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'CREATING',
        deadline: new Date('2026-05-20T00:00:00.000Z'),
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DEVELOPMENT',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.moveStage('p1', { stage: 'DEVELOPMENT' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DEVELOPMENT',
            deliveryStage: 'DEVELOPMENT',
            deliveryWorkStatus: 'ACTIVE',
          }),
        }),
      );
      expect(result.deliveryLifecycle.stage).toBe('DEVELOPMENT');
    });

    it('blocks stage movement while product is paused', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.moveStage('p1', { stage: 'QA' })).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('completes product delivery through dedicated action', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DONE',
        deliveryStage: null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'DONE',
      });

      const result = await service.complete('p1', 'emp-1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DONE',
            deliveryStage: null,
            deliveryWorkStatus: 'ACTIVE',
            deliveryResolution: 'DONE',
            closedById: 'emp-1',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'PRODUCT',
          entityId: 'p1',
          action: 'delivery.completed',
          userId: 'emp-1',
          projectId: 'proj-1',
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('DONE');
    });

    it('releases held subscription accruals when a linked order exists', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DONE',
        deliveryStage: null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'DONE',
      });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.complete('p1', 'emp-1');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
    });

    it('still fires classic accrual and bonus-pool sync from complete', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'DONE',
        deliveryStage: null,
        deliveryWorkStatus: 'ACTIVE',
        deliveryResolution: 'DONE',
      });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.complete('p1', 'emp-1');

      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).toHaveBeenCalledWith('ord-1');
      expect(syncProductBonusPoolForOrder).toHaveBeenCalledWith(prisma, 'ord-1', notifications);
    });

    it('blocks completion until client acceptance is recorded', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
        extensions: [],
        tasks: [],
        tickets: [],
        order: { status: 'FULLY_PAID', invoices: [] },
      });

      const error = await service.complete('p1', 'emp-1').catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(BadRequestException);
      expect(readExceptionResponse(error)).toMatchObject({
        code: 'STAGE_GATE_VALIDATION',
        errors: [{ field: 'clientAcceptance', message: expect.any(String) }],
      });
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('records client acceptance for active product delivery', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ACTIVE',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'TRANSFER',
        clientAcceptedAt: new Date('2026-04-29T09:00:00.000Z'),
        clientAcceptedBy: 'Client PM',
        clientAcceptanceNote: 'Approved after handoff call',
      });

      const result = await service.confirmAcceptance('p1', {
        acceptedBy: ' Client PM ',
        note: ' Approved after handoff call ',
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clientAcceptedAt: expect.any(Date),
            clientAcceptedBy: 'Client PM',
            clientAcceptanceNote: 'Approved after handoff call',
          }),
        }),
      );
      expect(result.clientAcceptedBy).toBe('Client PM');
    });

    it('blocks completion while product is paused', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'TRANSFER',
        deliveryWorkStatus: 'ON_HOLD',
      });

      await expect(service.complete('p1', 'emp-1')).rejects.toThrow(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });
});
