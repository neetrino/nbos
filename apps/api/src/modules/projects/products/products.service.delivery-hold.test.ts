import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProductsServiceHarness,
  clearProductsServiceHarness,
  type ProductsServiceHarness,
} from './products.service.test-harness';

vi.mock('../../bonus/product-bonus-pool-sync', () => ({
  syncProductBonusPoolForOrder: vi.fn().mockResolvedValue(undefined),
}));

import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';

describe('ProductsService', () => {
  let service: ProductsServiceHarness['service'];
  let prisma: ProductsServiceHarness['prisma'];
  let partnerAccrualClassic: ProductsServiceHarness['partnerAccrualClassic'];
  let partnerAccrualSubscription: ProductsServiceHarness['partnerAccrualSubscription'];
  let auditService: ProductsServiceHarness['auditService'];

  beforeEach(() => {
    const harness = createProductsServiceHarness();
    clearProductsServiceHarness(harness);
    service = harness.service;
    prisma = harness.prisma;
    partnerAccrualClassic = harness.partnerAccrualClassic;
    partnerAccrualSubscription = harness.partnerAccrualSubscription;
    auditService = harness.auditService;
  });

  describe('dedicated delivery actions', () => {
    it('pauses product delivery with canonical hold fields', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'DEVELOPMENT' });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'DEVELOPMENT',
        deliveryWorkStatus: 'ON_HOLD',
        deliveryResolution: null,
        onHoldReason: 'Waiting for client',
        onHoldUntil: new Date('2026-05-01T00:00:00.000Z'),
      });

      const result = await service.pause('p1', {
        reason: 'Waiting for client',
        onHoldUntil: '2026-05-01T00:00:00.000Z',
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ON_HOLD',
            deliveryStage: 'DEVELOPMENT',
            deliveryWorkStatus: 'ON_HOLD',
            onHoldReason: 'Waiting for client',
          }),
        }),
      );
      expect(result.deliveryLifecycle.workStatus).toBe('ON_HOLD');
    });

    it('resumes product delivery to the saved canonical stage', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'ON_HOLD',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ON_HOLD',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'QA',
        deliveryStage: 'QA',
        deliveryWorkStatus: 'ACTIVE',
      });

      const result = await service.resume('p1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'QA',
            deliveryWorkStatus: 'ACTIVE',
            onHoldReason: null,
            onHoldUntil: null,
          }),
        }),
      );
      expect(result.status).toBe('QA');
    });

    it('cancels product delivery with a reason', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'LOST',
        deliveryResolution: 'CANCELLED',
        cancellationReason: 'Scope cancelled',
      });

      const result = await service.cancel('p1', { reason: 'Scope cancelled' }, 'emp-1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'LOST',
            deliveryStage: null,
            deliveryResolution: 'CANCELLED',
            cancellationReason: 'Scope cancelled',
            closedById: 'emp-1',
          }),
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'PRODUCT',
          action: 'delivery.cancelled',
          userId: 'emp-1',
        }),
      );
      expect(result.deliveryLifecycle.resolution).toBe('CANCELLED');
    });

    it('cancels held subscription accruals when product ends LOST via cancel', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        projectId: 'proj-1',
        status: 'DEVELOPMENT',
      });
      prisma.product.update.mockResolvedValue({
        id: 'p1',
        status: 'LOST',
        deliveryResolution: 'CANCELLED',
        cancellationReason: 'Scope cancelled',
      });
      prisma.order.findUnique.mockResolvedValue({ id: 'ord-1' });

      await service.cancel('p1', { reason: 'Scope cancelled' }, 'emp-1');

      expect(partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery).toHaveBeenCalledWith(
        'ord-1',
      );
      expect(partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery).not.toHaveBeenCalled();
      expect(partnerAccrualClassic.tryInboundClassicAfterDelivery).not.toHaveBeenCalled();
      expect(syncProductBonusPoolForOrder).not.toHaveBeenCalled();
    });
  });
});
